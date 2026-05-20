#!/usr/bin/env bash

set -e

function getCreateDate() {
  local filePath=$1
  local takenAt

  takenAt=$(exiftool -CreateDate -s3 -d %s "$filePath" 2>/dev/null | head -n 1 || true)
  takenAt=$(echo "$takenAt" | tr -d '[:space:]')

  if [[ -z "$takenAt" || ! "$takenAt" =~ ^[0-9]+$ ]]; then
    takenAt=$(exiftool -DateTimeOriginal -s3 -d %s "$filePath" 2>/dev/null | head -n 1 || true)
    takenAt=$(echo "$takenAt" | tr -d '[:space:]')
  fi

  if [[ -z "$takenAt" || ! "$takenAt" =~ ^[0-9]+$ ]]; then
    takenAt=$(stat -f "%m" "$filePath" 2>/dev/null || true)
    takenAt=$(echo "$takenAt" | tr -d '[:space:]')
  fi

  if [[ -z "$takenAt" || ! "$takenAt" =~ ^[0-9]+$ ]]; then
    takenAt=$(date +%s)
  fi

  echo "$takenAt"
}

function doSync() {
  local fullPath=$1
  local coverImage=$2
  local albumName=$(basename "$fullPath")
  local albumId=$(uuidgen)
  local createdAt=$(date +%s)

  echo "Album Name: $albumName"

  # Validate dependencies
  if ! command -v sips &> /dev/null; then
    echo "Error: sips CLI is required (built-in on macOS)."
    exit 1
  fi
  if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg CLI is required. Please install it, e.g., 'brew install ffmpeg'."
    exit 1
  fi

  read -r -p "Sync \"$albumName\" to S3? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi

  local cleanPath="${fullPath%/}"
  local totalFiles=$(find "$cleanPath" -type f ! -path '*/.*' | wc -l | tr -d '[:space:]')
  local currentFile=0

  # Setup temp directory for local thumbnail processing
  local tempDir=$(mktemp -d)
  trap 'rm -rf "$tempDir"' EXIT

  echo "Uploading $totalFiles files from $cleanPath..."

  while IFS= read -r -d '' filePath; do
    ((currentFile++))
    local relativePath="${filePath#$cleanPath/}"
    local ext="${filePath##*.}"
    local ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

    local takenAt=$(getCreateDate "$filePath")
    local destinationKey="$takenAt-$relativePath"

    # Define temp thumbnail destination
    local tempThumbnail="$tempDir/${destinationKey}.jpg"
    mkdir -p "$(dirname "$tempThumbnail")"

    local isImage=false
    local isVideo=false

    if [[ "$ext_lower" =~ ^(jpg|jpeg|png|heic|heif|webp|gif)$ ]]; then
      isImage=true
    elif [[ "$ext_lower" =~ ^(mp4|mov|m4v|avi)$ ]]; then
      isVideo=true
    fi

    # Generate thumbnail
    if [ "$isImage" = true ]; then
      sips -s format jpeg -Z 600 "$filePath" --out "$tempThumbnail" &>/dev/null || echo "Warning: Failed to generate image thumbnail for $relativePath"
    elif [ "$isVideo" = true ]; then
      ffmpeg -y -i "$filePath" -ss 00:00:01 -vframes 1 -vf "scale=600:-1" "$tempThumbnail" &>/dev/null || echo "Warning: Failed to extract video thumbnail for $relativePath"
    fi

    echo "($currentFile/$totalFiles) Uploading $relativePath as $destinationKey..."
    # Upload original to images bucket
    aws s3 cp "$filePath" "s3://jimandfangzhuo.com-images-us-east-1/$albumName/$destinationKey"

    # Upload thumbnail if generated
    if [ -f "$tempThumbnail" ]; then
      aws s3 cp "$tempThumbnail" "s3://jimandfangzhuo.com-thumbnails-us-east-1/$albumName/$destinationKey" --content-type "image/jpeg"
    fi
  done < <(find "$cleanPath" -type f ! -path '*/.*' -print0)

  local coverImagePath="$cleanPath/$coverImage"
  local coverImageObjectKey="$coverImage"

  if [[ -f "$coverImagePath" ]]; then
    local coverImageTimestamp=$(getCreateDate "$coverImagePath")
    coverImageObjectKey="$coverImageTimestamp-$coverImage"
  fi

  aws dynamodb put-item \
    --table-name AlbumMetadata \
    --item '{
      "albumId": {"S": "'"$albumId"'"},
      "albumName": {"S": "'"$albumName"'"},
      "coverImageObjectKey": {"S": "'"$coverImageObjectKey"'"},
      "createdAt": {"N": "'"$createdAt"'"}
    }'
}

doSync "$@"

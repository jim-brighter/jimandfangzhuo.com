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

  read -r -p "Sync \"$albumName\" to S3? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi

  local cleanPath="${fullPath%/}"
  local totalFiles=$(find "$cleanPath" -type f ! -path '*/.*' | wc -l | tr -d '[:space:]')
  local currentFile=0

  echo "Uploading $totalFiles files from $cleanPath..."

  while IFS= read -r -d '' filePath; do
    ((currentFile++))
    local relativePath="${filePath#$cleanPath/}"

    local takenAt=$(getCreateDate "$filePath")

    local destinationKey="$takenAt-$relativePath"

    echo "($currentFile/$totalFiles) Uploading $relativePath as $destinationKey..."
    aws s3 cp "$filePath" "s3://jimandfangzhuo.com-images-us-east-1/$albumName/$destinationKey"
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

#!/usr/bin/env bash

set -e

function doSync() {
  local fullPath=$1
  local coverImage=$2
  local albumName=$(basename "$fullPath")
  local albumId=$(uuidgen)
  local createdAt=$(date +%s)

  aws s3 sync "$fullPath" "s3://jimandfangzhuo.com-images-us-east-1/$albumName"

  aws dynamodb put-item \
    --table-name AlbumMetadata \
    --item '{
      "albumId": {"S": "'"$albumId"'"},
      "albumName": {"S": "'"$albumName"'"},
      "coverImageObjectKey": {"S": "'"$coverImage"'"},
      "createdAt": {"N": "'"$createdAt"'"}
    }'
}

doSync "$@"

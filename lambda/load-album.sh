#!/usr/bin/env bash

set -e

# Run the TypeScript loader script using jiti
npx jiti "$(dirname "$0")/load-album.ts" "$@"

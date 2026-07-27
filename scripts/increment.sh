#!/usr/bin/env bash
set -euo pipefail

version=$(<VERSION)

if [[ $version =~ ^([0-9]+\.[0-9]+\.[0-9]+)-([0-9]+)$ ]]; then
  prefix="${BASH_REMATCH[1]}"
  build="${BASH_REMATCH[2]}"

  new_version="${prefix}-$((build + 1))"

  echo "$new_version" >VERSION
  echo "$new_version"
else
  echo "Invalid version format: $version" >&2
  exit 1
fi

#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="${1:-$ROOT_DIR/.framework/PRD_SOURCE_COPY.md}"
TARGET="${2:-$ROOT_DIR/.framework/ROLLBACK_TARGET.md}"
mkdir -p "$(dirname "$TARGET")"
cp "$SOURCE" "$TARGET"
printf 'ROLLBACK_RESTORED=%s\n' "$TARGET"
printf 'ROLLBACK_SOURCE=%s\n' "$SOURCE"
printf 'ROLLBACK_SHA256='
shasum -a 256 "$TARGET" | awk '{print $1}'

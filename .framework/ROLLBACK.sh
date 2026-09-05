#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-$ROOT_DIR/.framework/ROLLBACK_TARGET}"
SOURCE="${2:-backend/Zeabur.Dockerfile}"
COMMIT="${3:-HEAD~1}"
mkdir -p "$(dirname "$TARGET")"
git -C "$ROOT_DIR" show "$COMMIT:$SOURCE" > "$TARGET"
printf 'ROLLBACK_RESTORED=%s\n' "$TARGET"
printf 'ROLLBACK_SOURCE=%s\n' "$SOURCE"
printf 'ROLLBACK_COMMIT=%s\n' "$COMMIT"
printf 'ROLLBACK_SHA256='
shasum -a 256 "$TARGET" | awk '{print $1}'

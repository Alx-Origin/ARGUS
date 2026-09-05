#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-$ROOT_DIR/.framework/ROLLBACK_TARGET}"
mkdir -p "$(dirname "$TARGET")"
git -C "$ROOT_DIR" show HEAD:frontend/app/page.tsx > "$TARGET"
printf 'ROLLBACK_RESTORED=%s\n' "$TARGET"
printf 'ROLLBACK_SHA256='
shasum -a 256 "$TARGET" | awk '{print $1}'

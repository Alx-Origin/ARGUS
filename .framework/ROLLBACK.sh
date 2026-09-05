#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-$ROOT_DIR/.framework/ROLLBACK_TARGET}"
mkdir -p "$(dirname "$TARGET")"
cp "$ROOT_DIR/legacy/index.html" "$TARGET"
printf 'ROLLBACK_RESTORED=%s\n' "$TARGET"
printf 'ROLLBACK_SHA256='
sha256sum "$TARGET" | awk '{print $1}'

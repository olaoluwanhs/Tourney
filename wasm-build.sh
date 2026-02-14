#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_DIR="$ROOT_DIR/packages/lib/wasm"

mkdir -p "$OUT_DIR"

export GOOS=js
export GOARCH=wasm

go build -o "$OUT_DIR/tournament.wasm" "$ROOT_DIR/cmd/wasm"

GOROOT_PATH="$(go env GOROOT)"
cp "$GOROOT_PATH/lib/wasm/wasm_exec.js" "$OUT_DIR/wasm_exec.js"

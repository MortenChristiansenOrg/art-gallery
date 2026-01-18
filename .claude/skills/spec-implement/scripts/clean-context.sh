#!/bin/bash
# Clear .context directory (AI scratchpad)

set -e

CONTEXT_DIR=".context"

if [[ -d "$CONTEXT_DIR" ]]; then
    rm -rf "$CONTEXT_DIR"/*
    echo "Cleaned $CONTEXT_DIR"
else
    mkdir -p "$CONTEXT_DIR"
    echo "Created $CONTEXT_DIR"
fi

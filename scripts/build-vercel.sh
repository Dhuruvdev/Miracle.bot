#!/usr/bin/env bash
# Vercel build script — downloads Yarn 4 on-the-fly so no committed binary is needed.
set -euo pipefail

YARN4="/tmp/yarn4.js"
YARN4_URL="https://repo.yarnpkg.com/4.10.3/packages/yarnpkg-cli/bin/yarn.js"

if [ ! -f "$YARN4" ]; then
  echo "▶ Downloading Yarn 4..."
  curl -fsSL "$YARN4_URL" -o "$YARN4"
fi

YARN="node ${YARN4}"

echo "▶ Yarn version: $(${YARN} --version)"
echo "▶ Building components-sdk..."
${YARN} workspace components-sdk build

echo "▶ Building frontend..."
${YARN} workspace frontend build

echo "✓ Vercel build complete — output at frontend/dist"

#!/bin/bash
set -e

YARN4="/tmp/yarn4.js"
YARN4_URL="https://repo.yarnpkg.com/4.10.3/packages/yarnpkg-cli/bin/yarn.js"

if [ ! -f "$YARN4" ]; then
  echo "Downloading Yarn 4..."
  curl -fsSL "$YARN4_URL" -o "$YARN4"
fi

echo "Installing dependencies..."
node "$YARN4" install

echo "Starting dev server..."
node "$YARN4" workspace website dev

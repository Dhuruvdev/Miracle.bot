#!/usr/bin/env bash
# Vercel build script — always uses the committed Yarn 4 binary so the
# correct version is guaranteed regardless of what Vercel has installed globally.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN="node ${REPO_ROOT}/.yarn/releases/yarn.cjs"

echo "▶ Yarn version: $(${YARN} --version)"
echo "▶ Building components-sdk..."
${YARN} workspace components-sdk build

echo "▶ Building frontend..."
${YARN} workspace frontend build

echo "✓ Vercel build complete — output at frontend/dist"

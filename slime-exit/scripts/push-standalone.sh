#!/usr/bin/env bash
# slime-exit/ を Yosie-lab/slime-exit へ初回 push / 更新する（Mac ローカル用）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f package.json ] || [ ! -f index.html ]; then
  echo "Error: run from slime-exit/ repo root (index.html + package.json required)." >&2
  exit 1
fi

if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "Initial commit: Slime Exit"
  git branch -M main
  git remote add origin https://github.com/Yosie-lab/slime-exit.git
elif ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin https://github.com/Yosie-lab/slime-exit.git
fi

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit."
else
  git commit -m "Update Slime Exit"
fi

git branch -M main
echo "Pushing to https://github.com/Yosie-lab/slime-exit (main)..."
git push -u origin main
echo "Done. Enable Pages: Settings → Pages → GitHub Actions"

#!/usr/bin/env bash
# 公開：組み立てた index.html・seiseki.html・images を、main 枝（GitHub Pages）に入れて送る
#   使い方：bash scripts/publish.sh <main 枝を取り出したフォルダ> "変更の説明"
set -euo pipefail
cd "$(dirname "$0")/.."
DEST="$1"; MSG="${2:-ことばの練習を更新}"
cp work/deliver/netlify/index.html work/deliver/netlify/seiseki.html "$DEST"/
mkdir -p "$DEST/images"; cp work/deliver/netlify/images/* "$DEST/images/"
touch "$DEST/.nojekyll"
cd "$DEST"; git add -A
git -c user.name="greengreen-training" -c user.email="greengreen-training@users.noreply.github.com" commit -m "$MSG" || { echo "変わったところは ありません"; exit 0; }
git -c push.negotiate=true push origin HEAD:main
echo "送りました。1〜2分で https://greengreen-training.github.io/kotoba-renshu/ に反映されます"

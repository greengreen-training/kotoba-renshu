#!/usr/bin/env bash
# ことばの練習：全部を組み立てる（どのフォルダに置いても動く）
#   できるもの：work/deliver/netlify/index.html（利用者のアプリ）・seiseki.html（成績一覧）・images/
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/build_apps.py      # 各練習を1つずつ組み立てる（src/gg/*.html）
python3 scripts/build.py           # 全部を1つのアプリにまとめる（work/グリーン・グリーン_ことばの練習.html）
python3 scripts/build_staff.py     # 成績一覧ページを作り、公開用フォルダにそろえる（work/deliver/netlify/）
echo "できました：work/deliver/netlify/"

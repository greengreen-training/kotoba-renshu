#!/usr/bin/env bash
# テスト用のサーバーを3つ立てる（テストの前に1回）
cd "$(dirname "$0")/.."
pkill -f "http.server 876[56]" 2>/dev/null; pkill -f "http.server 8770" 2>/dev/null
(cd src/gg && nohup python3 -m http.server 8766 >/dev/null 2>&1 &)
(cd work/deliver/netlify && nohup python3 -m http.server 8765 >/dev/null 2>&1 &)
(cd work/deliver/netlify && nohup python3 -m http.server 8770 >/dev/null 2>&1 &)
sleep 1; echo "8765・8770：公開用フォルダ　8766：練習ひとつずつ"

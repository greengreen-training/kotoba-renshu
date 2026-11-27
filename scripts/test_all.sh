#!/usr/bin/env bash
# 組み立てたものを全部テストする（Playwright と Chrome または Chromium が必要）
cd "$(dirname "$0")"
bash ./serve.sh
fail=0
for t in validate.py test_apps.py test_suite.py test_hw_apps.py test_plan.py test_voice.py test_send.py test_cal.py test_homework.py; do
  echo "=== $t"
  out=$(timeout 900 python3 "$t" 2>&1); echo "$out" | tail -4
  if echo "$out" | grep -qE "Traceback|^NG|BAD \[.+\]|BAD [1-9]"; then fail=1; echo "!!! $t に失敗があります"; fi
done
[ $fail = 0 ] && echo "全部 通りました" || { echo "失敗があります"; exit 1; }

"""まちがえた問題の復習（common.js の しくみ）を、選ぶ形の練習 全部で確かめる
   ・どの難しさ・しゅるいの問題も ためられ、復習で そのまま出せる（ページのエラーが出ない）
   ・復習で〇になった問題は消え、×のままの問題は残る
   ・復習の成績は review:true・難しさ「復習」で送られる
   ・声で こたえる練習（文をつくろう・セリフをいいましょう）には 付かない
   ・並べ替えは 復習でも 字が ことばの順のまま 出ない"""
import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
from playwright.sync_api import sync_playwright
B = "http://localhost:8766/"
APPS = ["eawase", "oto", "oto2", "gojuon", "narabe", "narabe2", "nakama", "meishi", "joshi", "doushi", "doushi2", "serifu"]
NO_REVIEW = ["bun", "serifu2"]

SEED = """() => {
  localStorage.clear();
  window.__msgs = []; window.addEventListener('message', e => { if (e.data && e.data.gg === 'result') window.__msgs.push(e.data); });
  const types = APP.types ? APP.types.map(t => t.key) : [null];
  let made = 0;
  for (const lv of ['easy', 'normal', 'hard']) for (const ty of types) {
    curType = ty; const qs = APP.make(lv, ty);
    fkSave(qs[0], lv, ty, 0); fkSave(qs[1], lv, ty, 0.5); made += 2;
  }
  curType = types[0]; renderTitle();
  return { made, saved: fkList().length };
}"""

def main():
    bad = 0
    def check(name, ok, info=""):
        nonlocal bad
        bad += not ok
        print("OK " if ok else "NG ", name, info if not ok else "")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        for app in APPS:
            pg = b.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(B + app + ".html"); pg.wait_for_timeout(400)
            r = pg.evaluate(SEED)
            n = min(r["saved"], 10)
            check(f"{app} ためる", r["saved"] == min(r["made"], 30), r)
            check(f"{app} はじめの画面のボタン", pg.locator("#fkTitle").is_visible() and f"{n}" in pg.inner_text("#fkTitle"), pg.inner_text("#fkTitle"))
            pg.click("#fkTitle"); pg.wait_for_timeout(250)
            check(f"{app} 復習中の印", pg.inner_text("#qno").startswith("復習"), pg.inner_text("#qno"))
            shown = 0
            for k in range(n):
                ok = pg.locator("#quiz").is_visible() and pg.evaluate("document.querySelector('#stage').innerHTML.length + document.querySelector('#choices').innerHTML.length") > 0
                if app in ("narabe", "narabe2"):
                    ok = ok and pg.evaluate("(() => { const q = S.qs[S.i], w = [...q.word], set = new Set(w); return q.tiles.filter(c => set.has(c)).join('') !== w.join(''); })()")
                shown += ok
                pg.evaluate(f"API.score({0 if k == 0 else 1})")   # 1問目だけ ×、ほかは 〇
                pg.wait_for_timeout(60); pg.click("#next"); pg.wait_for_timeout(120)
            check(f"{app} 復習で {n}問 出せる", shown == n, f"{shown}/{n} {errs[:2]}")
            res = pg.evaluate("({ meta: document.querySelector('#rMeta').textContent, left: fkList().length, msg: window.__msgs[window.__msgs.length - 1] || null })")
            check(f"{app} 〇は消え ×は残る", res["left"] == r["saved"] - (n - 1), res["left"])
            m = res["msg"] or {}
            check(f"{app} 復習の成績", m.get("review") is True and m.get("levelName") == "復習" and m.get("max") == n and "復習" in res["meta"], m)
            check(f"{app} 結果の画面のボタン", pg.locator("#fkResult").is_visible() == (res["left"] > 0))
            check(f"{app} 復習のあとは もう一度を出さない", not pg.locator("#again").is_visible())
            if app == "narabe": pg.screenshot(path=f"{SHOTS}/review_result.png")
            check(f"{app} ページのエラーなし", not errs, errs[:3])
            pg.close()
        for app in NO_REVIEW:
            pg = b.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(B + app + ".html"); pg.wait_for_timeout(400)
            r = pg.evaluate("() => { localStorage.clear(); const qs = APP.make('easy', APP.types ? APP.types[0].key : null); fkSave(qs[0], 'easy', null, 0); renderTitle(); return fkList().length; }")
            check(f"{app} 声の練習には付かない", r == 0 and not pg.locator("#fkTitle").is_visible() and not errs, [r, errs[:2]])
            pg.close()
        # ふだんの練習で〇になったら消える
        pg = b.new_page(); pg.goto(B + "meishi.html"); pg.wait_for_timeout(400)
        left = pg.evaluate("() => { localStorage.clear(); const q = APP.make('easy')[0]; S = { lv:'easy', qs:[q], i:0 }; fkSave(q, 'easy', null, 0); const a = fkList().length; fkSave(q, 'easy', null, 1); return [a, fkList().length]; }")
        check("ふだんの練習で〇なら消える", left == [1, 0], left)
        pg.goto(B + "narabe.html"); pg.wait_for_timeout(400)
        pg.evaluate(SEED); pg.click("#fkTitle"); pg.wait_for_timeout(300)
        pg.screenshot(path=f"{SHOTS}/review_quiz.png")
        pg.close()
        b.close()
    print("BAD", bad)

main()

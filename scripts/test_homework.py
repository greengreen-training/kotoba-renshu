import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
"""宿題（お題・問題数・選択肢・回数・期限）を、職員ページ → 受け取りスクリプト（本物の .gs をにせものの上で動かす）→ 利用者のアプリ まで通して確かめる"""
import json, subprocess, time, urllib.request, urllib.parse, re
from playwright.sync_api import sync_playwright

DEP = "AKfycbTESTdeploymentid1234567890abcdef"
BASE = "http://localhost:8770/"
GAS = "http://localhost:8799/"
srv = subprocess.Popen(["node", f"{ROOT}/scripts/gas_server.js", f"{ROOT}/work/deliver/成績受け取りスクリプト.gs", "8799", "testpass"], stdout=subprocess.PIPE)
srv.stdout.readline()
BAD = []
def check(name, ok, info=""):
    print(("OK  " if ok else "NG  ") + name, info if not ok or info else "")
    if not ok: BAD.append(name)

def gas(route):
    req = route.request
    q = urllib.parse.urlparse(req.url).query
    if req.method == "POST":
        r = urllib.request.urlopen(urllib.request.Request(GAS, data=(req.post_data or "").encode(), method="POST"))
    else:
        r = urllib.request.urlopen(GAS + "?" + q)
    route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}, body=r.read())

def get(q): return json.loads(urllib.request.urlopen(GAS + "?" + q).read())

try:
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"])
        errs = []
        st = b.new_context(viewport={"width": 1200, "height": 1000})
        st.route("https://script.google.com/**", gas)
        sp = st.new_page(); sp.on("pageerror", lambda e: errs.append("staff:" + str(e)))
        sp.goto(BASE + "seiseki.html")
        sp.click("#t-setup") if sp.locator("#t-setup").count() else None
        sp.fill("#cfgUrl", f"https://script.google.com/macros/s/{DEP}/exec"); sp.fill("#cfgKey", "testpass"); sp.fill("#cfgApp", BASE)
        sp.click("#saveCfg"); sp.wait_for_timeout(800)
        sp.click("#t-menu"); sp.fill("#mNew", "3"); sp.click("#mPick"); sp.wait_for_timeout(300)
        row = lambda name: sp.locator(".m-row", has=sp.locator(".m-on span", has_text=name)).first
        for name in ["ことば並べ替え（初級）", "仲間えらび", "語想起タイムアタック"]:
            row(name).locator("input[data-f=on]").check(); sp.wait_for_timeout(100)
        # まとめて：難しさを「難しい」
        sp.click("[data-blv=hard]"); sp.wait_for_timeout(150)
        lvs = [row(n).locator("select[data-f=lv]").input_value() for n in ["ことば並べ替え（初級）", "仲間えらび", "語想起タイムアタック"]]
        check("まとめて 難しさ", lvs == ["hard"] * 3, lvs)
        sp.select_option("#mBulkTimes", "2"); sp.wait_for_timeout(150)
        check("まとめて 回数", [row(n).locator("select[data-f=times]").input_value() for n in ["ことば並べ替え（初級）", "仲間えらび"]] == ["2", "2"])
        # 語想起：簡単・カテゴリ・お題（魚・野菜）・お題の数2・3回
        g = row("語想起タイムアタック")
        g.locator("select[data-f=lv]").select_option("easy"); sp.wait_for_timeout(100)
        g.locator("select[data-f=type]").select_option("cat"); sp.wait_for_timeout(100)
        g = row("語想起タイムアタック"); g.locator("[data-topen]").first.click(); sp.wait_for_timeout(150)
        g = row("語想起タイムアタック")
        groups = g.locator(".m-tg legend").all_inner_texts()
        check("語想起 カテゴリだけ出る", all(x.startswith("カテゴリ") for x in groups) and len(groups) == 3, groups)
        for t in ["魚", "野菜"]: g.locator(".m-tp", has_text=re.compile("^" + t + "$")).locator("input").check(); sp.wait_for_timeout(80)
        row("語想起タイムアタック").locator("select[data-f=n]").select_option("2"); sp.wait_for_timeout(100)
        row("語想起タイムアタック").locator("select[data-f=times]").select_option("3"); sp.wait_for_timeout(100)
        # 並べ替え：まぜる字 0、回数 1
        row("ことば並べ替え（初級）").locator("select[data-f=opts]").select_option("0"); sp.wait_for_timeout(100)
        row("ことば並べ替え（初級）").locator("select[data-f=times]").select_option("1"); sp.wait_for_timeout(100)
        # 仲間えらび：カード5枚、お題は「全部」→ 回数なし
        n = row("仲間えらび"); n.locator("select[data-f=opts]").select_option("5"); sp.wait_for_timeout(100)
        row("仲間えらび").locator("[data-topen]").first.click(); sp.wait_for_timeout(100)
        row("仲間えらび").locator("[data-tg$=':all']").first.click(); sp.wait_for_timeout(100)
        row("仲間えらび").locator("select[data-f=times]").select_option("0"); sp.wait_for_timeout(100)
        sp.fill("#mDue", "2026-12-01"); sp.dispatch_event("#mDue", "change")
        sp.click("#mSave"); sp.wait_for_timeout(900)
        msg = sp.inner_text("#mSaveMsg")
        check("保存", "宿題が出ます" in msg, msg)
        m = get("menu=3")
        items = {x["app"]: x for x in m["items"]}
        check("受け取り：並び", [x["app"] for x in m["items"]] == ["narabe", "nakama", "goso"], [x["app"] for x in m["items"]])
        check("受け取り：語想起", items["goso"] == {"app": "goso", "lv": "easy", "type": "cat", "topics": ["cat:魚", "cat:野菜"], "times": 3, "n": 2}, items["goso"])
        check("受け取り：並べ替え", items["narabe"].get("opts") == 0 and items["narabe"].get("times") == 1 and items["narabe"]["lv"] == "hard", items["narabe"])
        check("受け取り：仲間", items["nakama"].get("opts") == 5 and len(items["nakama"].get("topics", [])) == 21 and "times" not in items["nakama"], items["nakama"])
        check("受け取り：期限", m["due"] == "2026-12-01" and m["done"] == [0, 0, 0], (m["due"], m["done"]))
        check("職員：いまの宿題", "宿題" in sp.inner_text("#mNow") and "0 / 3回" in sp.inner_text("#mNow"), sp.inner_text("#mNow")[:300])

        # ---------- 利用者のアプリ ----------
        uc = b.new_context(viewport={"width": 420, "height": 900})
        uc.route("https://script.google.com/**", gas)
        up = uc.new_page(); up.on("pageerror", lambda e: errs.append("app:" + str(e)))
        up.goto(BASE + f"?u=3&s={DEP}"); up.wait_for_timeout(1500)
        check("アプリ：見出し", up.inner_text("#planTitle").replace("しゅくだい","").replace("\n","") == "あなたの 宿題", up.inner_text("#planTitle"))
        check("アプリ：期限", "12月1日（火）" in up.inner_text(".hw-due"), up.inner_text("#planBox")[:200])
        cards = up.locator("#planBox .app")
        check("アプリ：3つ", cards.count() == 3)
        chips = [c.inner_text() for c in up.locator("#planBox .app .chip").all()]
        for want in ["お題：魚・野菜", "2つの お題", "まぜる字 0", "カード 5枚", "お題 21こ", "カテゴリ", "簡単", "難しい"]:
            check("アプリ：チップ " + want, want in chips, chips)
        check("アプリ：回数の点", up.locator("#planBox .hw").count() == 2 and up.locator(".hw-dots i").count() == 4, up.locator(".hw-dots i").count())

        def run(app_glyph_text, result, close=True):
            up.locator(f"#planBox .app[data-plan-app={app_glyph_text}]").first.click(); up.wait_for_timeout(1200)
            fr = up.frame_locator("iframe")
            frame = up.frames[1]
            fx = frame.evaluate("window.GG_FIX")
            frame.evaluate("r => parent.postMessage(Object.assign({ gg: 'result' }, r), '*')", result)
            up.wait_for_timeout(300)
            if close:
                up.click("#backBtn"); up.wait_for_timeout(300)
                if up.locator("#leaveScrim").is_visible(): up.click("#leaveBtn")
                up.wait_for_timeout(500)
            return fx, frame
        fx, frame = run("goso", {"typeName": "カテゴリ", "levelName": "簡単", "score": 2, "max": 0, "items": ["魚", "野菜"]})
        check("アプリ：語想起に渡す設定", fx == {"lv": "easy", "type": "cat", "topics": ["cat:魚", "cat:野菜"], "n": 2, "opts": None}, fx)
        check("アプリ：1回目を数える", "1 / 3回" in up.inner_text("#planBox"), up.inner_text("#planBox")[:400])
        fx, frame = run("narabe", {"typeName": "", "levelName": "難しい", "score": 1.5, "max": 2, "marks": "〇×", "items": ["ねこ〇（2.1秒）", "うさぎ×（5.3秒・えらんだ：さ、う）"]}, close=False)
        q0 = frame.evaluate("S && S.qs ? S.qs.every(q => q.tiles.length === q.word.length) : null")
        check("アプリ：並べ替え まぜる字0", q0 is True, q0)
        up.click("#backBtn"); up.wait_for_timeout(300)
        if up.locator("#leaveScrim").is_visible(): up.click("#leaveBtn")
        up.wait_for_timeout(500)
        check("アプリ：できた", up.locator("#planBox .app.hw-done").count() == 1 and "✓ できた" in up.inner_text("#planBox"))
        fx, frame = run("nakama", {"typeName": "", "levelName": "難しい", "score": 7, "max": 10, "marks": "〇〇×", "items": ["くだもの〇（3秒）", "野菜×（9秒・えらんだ：りんご）"]}, close=False)
        nk = frame.evaluate("[S.qs.length, [...new Set(S.qs.map(q => q.cards.length))]]")
        check("アプリ：仲間 カード5枚", nk == [10, [5]], nk)
        up.click("#backBtn"); up.wait_for_timeout(300)
        if up.locator("#leaveScrim").is_visible(): up.click("#leaveBtn")
        up.wait_for_timeout(400)
        check("アプリ：まだ ぜんぶ ではない", up.locator(".hw-all").count() == 0)
        for k in range(2):
            run("goso", {"typeName": "カテゴリ", "levelName": "簡単", "score": 2, "max": 0, "items": ["魚", "野菜"]})
        check("アプリ：ぜんぶ できた", up.locator(".hw-all").count() == 1 and "3 / 3回" in up.inner_text("#planBox"), up.inner_text("#planBox")[:300])
        up.wait_for_timeout(2500)
        m = get("menu=3")
        check("受け取り：やった回数", m["done"] == [1, 1, 3], m["done"])
        # 別の端末（記録はこの端末にない）でも、受け取り先の数で ✓ が出る
        u2 = b.new_context(viewport={"width": 420, "height": 900}); u2.route("https://script.google.com/**", gas)
        p2 = u2.new_page(); p2.goto(BASE + f"?u=3&s={DEP}"); p2.wait_for_timeout(1500)
        check("別の端末：ぜんぶ できた", p2.locator(".hw-all").count() == 1, p2.inner_text("#planBox")[:300])

        # ---------- 職員：進み具合・回数ごと・問題ごと ----------
        sp.click("#t-data") if sp.locator("#t-data").count() else None
        sp.click("#reload"); sp.wait_for_timeout(1000)
        users = sp.inner_text("#users")
        check("職員：一覧の宿題", "宿題 2/2 ✓" in users, users[:300])
        sp.click(".user[data-u='3']"); sp.wait_for_timeout(600)
        det = sp.inner_text("#detail")
        check("職員：詳しい画面の宿題", "1 / 1回" in det and "3 / 3回" in det, det[:500])
        check("職員：回数ごと", sp.locator(".seq-chart circle").count() == 2, sp.locator(".seq-chart circle").count())
        check("職員：問題ごと", sp.locator("#qaBox .qa-t tbody tr").count() >= 2, sp.locator("#qaBox").inner_text()[:300] if sp.locator("#qaBox").count() else "なし")
        sp.select_option("#qaSel", label="ことば並べ替え（初級）") if sp.locator("#qaSel option", has_text="並べ替え").count() else None
        sp.wait_for_timeout(300)
        qa = sp.inner_text("#qaBox")
        check("職員：問題ごとの中身", "うさぎ" in qa and "ねこ" in qa, qa[:300])
        sp.check("#qaMiss"); sp.wait_for_timeout(300)
        qa = sp.inner_text("#qaBox")
        check("職員：まちがえた問題だけ", "うさぎ" in qa and "ねこ" not in qa, qa[:300])
        sp.screenshot(path=f"{SHOTS}/staff_detail.png", full_page=True)
        # ---------- ふりかえり ----------
        sp.click("#t-fb"); sp.wait_for_timeout(300)
        sp.select_option("#fbUser", "3"); sp.wait_for_timeout(300)
        sh = sp.inner_text("#fbSheet")
        check("ふりかえり：週", "ご自宅での 課題　ふりかえり" in sh.replace("じたく","").replace("かだい","").replace("\n","") and "〜" in sp.inner_text(".fb-top .fb-when") and "3 様" not in sh and "〜" in sh and "（今週）" not in sh and sp.locator(".fb-who.blank").count() == 1, sh[:400])
        check("ふりかえり：名前がない注意", sp.locator("#fbNameBox").is_visible() and "名前が まだ" in sp.inner_text("#fbNameBox"))
        sp.fill("#fbName", "山田 花子"); sp.click("#fbNameRow [data-savename]"); sp.wait_for_timeout(300)
        sh = sp.inner_text("#fbSheet")
        check("ふりかえり：名前が出る", "山田 花子 様" in sh and "さん" not in sp.inner_text(".fb-who") and sp.locator(".fb-who.blank").count() == 0 and "名前が まだ" not in sp.inner_text("#fbNameBox"), sh[:200])
        check("名前：一覧にも出る", "山田 花子" in sp.inner_text("#users"))
        check("ふりかえり：項目ごとの成績の見出し", "項目" in sh and "ようす" not in sh)
        check("ふりかえり：練習ごと", sp.locator(".fb-tbl tbody tr").count() == 3 and "70%" in sh, sp.locator(".fb-tbl tbody tr").count())
        check("ふりかえり：ふりがな", sp.locator(".fb-sheet ruby").count() > 10)
        check("ふりかえり：宿題", sp.locator(".fb-hw .fb-ok").count() >= 1 and "達成" in sh and "うち" in sp.inner_text(".fb-hw-sum"), sh[-300:])
        sp.evaluate("""() => { const it = menus['3'].items.find(x => x.times); it._t = it.times; it.times = it.times + 4; renderFb(); }""")
        ng = sp.inner_text(".fb-hw li.ng") if sp.locator(".fb-hw li.ng").count() else ""
        check("ふりかえり：未達成", "未達成" in ng and "あと 4回" in ng.replace("みたっせい",""), ng)
        sp.locator(".fb-hw").screenshot(path=f"{SHOTS}/fb_hw_ng.png")
        sp.evaluate("""() => { const it = menus['3'].items.find(x => x._t); it.times = it._t; delete it._t; renderFb(); }""")
        check("ふりかえり：1週目はグラフなし", sp.locator(".fb-trend").count() == 0)
        # 2週前の記録を1つ足すと、グラフ（3週ぶん・いまの週が濃い色）が出る
        sp.evaluate("""() => { const r = rows.find(x => x.user === '3'); const o = Object.assign({}, r); o.at = new Date(r.at.getTime() - 14 * 864e5); rows.push(o); renderFb(); }""")
        check("ふりかえり：2週目からグラフ", sp.locator(".fb-trend .fb-tc").count() == 3 and sp.locator(".fb-trend .fb-tc").first.locator(".bar").count() == 3 and sp.locator(".fb-trend .bar.now").count() == 3, sp.locator(".fb-trend .bar").count())
        sp.locator(".fb-sheet").screenshot(path=f"{SHOTS}/fb_week_graph.png")
        # 復習の記録（「〇〇（復習）」・ID に fk）は、項目ごとの成績に 読みがな付きで出て、宿題の回数には 数えない
        hw0 = sp.evaluate("JSON.stringify(hwCounts('3'))")
        sp.evaluate("""() => { const r = rows.find(x => x.user === '3' && x.appId); const o = Object.assign({}, r); o.app = r.app + '（復習）'; o.appId = r.appId + 'fk'; o.level = '復習'; rows.push(o); renderFb(); }""")
        fkrow = [t for t in sp.locator(".fb-tbl tbody tr td:first-child").all_inner_texts() if "復習" in t]
        check("ふりかえり：復習の記録", len(fkrow) == 1 and sp.locator(".fb-tbl tbody tr td:first-child ruby", has_text="復習").count() == 1 and sp.evaluate("JSON.stringify(hwCounts('3'))") == hw0, [fkrow, hw0])
        sp.uncheck("#fbGraph"); sp.wait_for_timeout(200)
        check("ふりかえり：グラフを外せる", sp.locator(".fb-trend").count() == 0)
        sp.check("#fbGraph"); sp.wait_for_timeout(200)
        sp.click("#fbAuto"); sp.wait_for_timeout(200)
        note = sp.input_value("#fbNote")
        check("ふりかえり：ひとことの例", "練習できました" in note and note in sp.inner_text("#fbNoteOut"), note)
        sp.check("input[name=fbKind][value=month]"); sp.wait_for_timeout(300)
        check("ふりかえり：月", "月" in sp.inner_text(".fb-top .fb-when") and sp.locator(".fb-month .fb-day").count() >= 28, sp.inner_text(".fb-who"))
        sp.check("input[name=fbKind][value=week]"); sp.wait_for_timeout(300)
        sp.locator(".fb-sheet").screenshot(path=f"{SHOTS}/fb_week.png")
        sp.emulate_media(media="print"); sp.evaluate("document.body.classList.add('print-fb')")
        check("ふりかえり：印刷では資料だけ", sp.locator("#fbSheet").is_visible() and not sp.locator(".tabs").is_visible() and not sp.locator("#fbUser").is_visible())
        sp.emulate_media(media="screen"); sp.evaluate("document.body.classList.remove('print-fb')")
        up.screenshot(path=f"{SHOTS}/app_plan.png", full_page=True)
        check("ページのエラーなし", not errs, errs[:5])
        b.close()
finally:
    srv.terminate()
print("BAD", BAD)

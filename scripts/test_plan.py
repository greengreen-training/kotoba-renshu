import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, json, urllib.parse, datetime
from playwright.async_api import async_playwright
DEP = "AKfycbTESTdeploymentid1234567890abcdef"
BASE = "http://localhost:8770/"
SHEET, MENUS = [], {}
MODE = {"old": False}
ARGS=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--autoplay-policy=no-user-gesture-required"]
async def gas(route):
    req = route.request
    hdr = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    if req.method == "POST":
        body = json.loads(req.post_data or "{}")
        if body.get("action") == "setmenu" and not MODE["old"]:
            if body.get("key") != "testpass": return await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": False, "error": "password"}))
            items = [x for x in body.get("items", []) if x.get("app")]
            MENUS[body["user"]] = {"items": items, "at": datetime.datetime.utcnow().isoformat()+"Z"}
            return await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": True, "user": body["user"], "items": items}))
        saved = []
        for r in body.get("records", []):
            saved.append(r["uid"]); SHEET.append([datetime.datetime.utcnow().isoformat()+"Z", r["ts"], r["user"], r["appName"], r["typeName"], r["levelName"], r["score"], r["max"], r["marks"], r["items"], r["sec"], r["uid"]])
        return await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": True, "saved": saved}))
    q = urllib.parse.parse_qs(urllib.parse.urlparse(req.url).query)
    if "menu" in q and not MODE["old"]:
        m = MENUS.get(q["menu"][0], {"items": [], "at": ""})
        return await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": True, "menu": True, "user": q["menu"][0], **m}))
    if q.get("key", [""])[0] != "testpass":
        return await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": False, "error": "password"}))
    out = {"ok": True, "rows": SHEET}
    if not MODE["old"]: out["menus"] = MENUS
    await route.fulfill(status=200, headers=hdr, body=json.dumps(out))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=ARGS)
        errs = []
        # ---------- 職員：練習メニューを決める ----------
        st = await b.new_context(viewport={"width":1100,"height":900})
        await st.route("https://script.google.com/**", gas)
        sp = await st.new_page(); sp.on("pageerror", lambda e: errs.append("staff:"+str(e)))
        await sp.goto(BASE + "seiseki.html")
        await sp.evaluate(f"""() => {{ localStorage.setItem('gg.staff.url', JSON.stringify('https://script.google.com/macros/s/{DEP}/exec')); localStorage.setItem('gg.staff.key', JSON.stringify('testpass')); localStorage.setItem('gg.staff.names', JSON.stringify({{A01:'やまださん', B02:'すずきさん'}})); }}""")
        await sp.reload(); await sp.wait_for_timeout(800)
        await sp.click('#t-menu'); await sp.wait_for_timeout(200)
        print("staff users:", await sp.evaluate("[...document.querySelectorAll('#mUser option')].map(o=>o.textContent)"))
        await sp.select_option('#mUser', 'A01'); await sp.wait_for_timeout(200)
        print("now:", await sp.inner_text('#mNow'))
        # 絵合わせ：色・簡単／＋で 形・難しい、風船ことば：難しい、助詞：本人がえらぶ、挨拶語
        idx = await sp.evaluate("() => { const r={}; draft.forEach((d,i)=>{ if(!(d.app in r)) r[d.app]=i; }); return r; }")
        await sp.check(f'input[data-i="{idx["eawase"]}"][data-f="on"]')
        await sp.select_option(f'select[data-i="{idx["eawase"]}"][data-f="type"]', 'color')
        await sp.select_option(f'select[data-i="{idx["eawase"]}"][data-f="lv"]', 'easy')
        await sp.click(f'[data-dup="{idx["eawase"]}"]')
        await sp.select_option(f'select[data-i="{idx["eawase"]+1}"][data-f="type"]', 'shape')
        idx = await sp.evaluate("() => { const r={}; draft.forEach((d,i)=>{ if(!(d.app in r)) r[d.app]=i; }); return r; }")
        await sp.check(f'input[data-i="{idx["fusen"]}"][data-f="on"]'); await sp.select_option(f'select[data-i="{idx["fusen"]}"][data-f="lv"]', 'hard')
        await sp.check(f'input[data-i="{idx["joshi"]}"][data-f="on"]'); await sp.select_option(f'select[data-i="{idx["joshi"]}"][data-f="lv"]', '')
        await sp.check(f'input[data-i="{idx["aisatsu"]}"][data-f="on"]')
        await sp.screenshot(path=f"{SHOTS}/st_menu.png", full_page=True)
        await sp.click('#mSave'); await sp.wait_for_timeout(500)
        print("save:", await sp.inner_text('#mSaveMsg'))
        print("MENUS:", json.dumps(MENUS, ensure_ascii=False))
        print("now:", await sp.inner_text('#mNow'))
        await sp.screenshot(path=f"{SHOTS}/st_menu_saved.png", full_page=True)

        # ---------- 利用者のスマホ ----------
        ph = await b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, permissions=["microphone"])
        await ph.route("https://script.google.com/**", gas)
        pg = await ph.new_page(); pg.on("pageerror", lambda e: errs.append("phone:"+str(e)))
        await pg.goto(f"{BASE}?u=A01&s={DEP}"); await pg.wait_for_timeout(1200)
        print("phone plan:", await pg.evaluate("[!document.getElementById('planBox').hidden, document.getElementById('planTitle').textContent, [...document.querySelectorAll('#planBox .app')].map(b=>b.querySelector('.app-name').textContent+'|'+[...b.querySelectorAll('.chip')].map(c=>c.textContent).join('・')), [...document.querySelectorAll('#menu .stage')].every(s=>s.hidden)]"))
        await pg.screenshot(path=f"{SHOTS}/ph_plan.png", full_page=True)
        tiles = pg.locator('#planBox .app')
        await tiles.nth(1).click(); await pg.wait_for_timeout(900)   # 絵合わせ 形・難しい
        fr = pg.frames[1]
        print("eawase#2:", await fr.evaluate("[!document.getElementById('quiz').hidden, S.lv, S.type]"), "| bar:", await pg.inner_text('#barName'))
        await pg.screenshot(path=f"{SHOTS}/ph_fixed.png")
        await fr.evaluate("""() => { for (let i=0;i<10;i++){ let g=0; while(document.getElementById('next').hidden && g++<40){ const en=[...document.querySelectorAll('#choices button:not(:disabled)')]; en[Math.floor(Math.random()*en.length)].click(); } document.getElementById('next').click(); } }""")
        print("result home btn:", await fr.inner_text('#home'))
        await fr.click('#home'); await pg.wait_for_timeout(500)
        print("back to menu:", await pg.evaluate("!document.getElementById('menu').hidden && document.getElementById('shell').hidden"))
        await tiles.nth(0).click(); await pg.wait_for_timeout(900)
        print("eawase#1:", await pg.frames[1].evaluate("[S.lv, S.type]"))
        await pg.click('#backBtn'); await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        await tiles.nth(2).click(); await pg.wait_for_timeout(1500)
        print("fusen auto start:", await pg.frames[1].evaluate("[!document.getElementById('play').hidden, getComputedStyle(document.getElementById('openSettings')).display]"))
        await pg.click('#backBtn'); await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        await tiles.nth(3).click(); await pg.wait_for_timeout(800)
        print("joshi (本人がえらぶ):", await pg.frames[1].evaluate("[!document.getElementById('title').hidden, document.querySelectorAll('.level').length]"))
        await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        await pg.evaluate("location.hash='nakama'"); await pg.wait_for_timeout(600)
        print("nakama blocked:", await pg.evaluate("document.getElementById('shell').hidden"))
        await tiles.nth(4).click(); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f"{SHOTS}/ph_aisatsu.png")
        await pg.click('#backBtn'); await pg.wait_for_timeout(300)

        # ---------- タブレット ----------
        tb = await b.new_context(viewport={"width":1024,"height":768}, permissions=["microphone"])
        await tb.route("https://script.google.com/**", gas)
        tp = await tb.new_page(); tp.on("pageerror", lambda e: errs.append("tablet:"+str(e)))
        await tp.goto(f"{BASE}?t=1&s={DEP}"); await tp.wait_for_timeout(400)
        await tp.evaluate("localStorage.setItem('gg.roster', JSON.stringify([{id:'A01',name:'やまださん'},{id:'B02',name:'すずきさん'}]))")
        await tp.reload(); await tp.wait_for_timeout(800)
        await tp.click('.who[data-id="A01"]'); await tp.wait_for_timeout(800)
        print("tablet A01:", await tp.evaluate("[!document.getElementById('planBox').hidden, document.getElementById('planTitle').textContent, document.querySelectorAll('#planBox .app').length]"))
        await tp.screenshot(path=f"{SHOTS}/tb_plan.png")
        await tp.click('#changeWho'); await tp.click('.who[data-id="B02"]'); await tp.wait_for_timeout(800)
        print("tablet B02:", await tp.evaluate("[document.getElementById('planBox').hidden, [...document.querySelectorAll('#menu .stage')].some(s=>!s.hidden)]"))
        # B02 は全部の練習：録音の練習を開く
        await tp.click('.app[data-app="gojuonrec"]'); await tp.wait_for_timeout(800)
        f = tp.frames[1]
        await f.click('.rowbtn[data-row="ka"]'); await f.click('#recBtn'); await tp.wait_for_timeout(1300); await f.click('#recBtn'); await tp.wait_for_timeout(1500)
        print("gojuonrec status:", await f.inner_text('#status'))
        await tp.click('#backBtn'); await tp.wait_for_timeout(300)
        await tp.click('.app[data-app="serifu2"]'); await tp.wait_for_timeout(800)
        f = tp.frames[1]; await f.click('.level[data-lv="easy"]'); await f.click('#recBtn'); await tp.wait_for_timeout(1200)
        busy = await tp.evaluate("(() => { document.getElementById('backBtn').click(); return !document.getElementById('leaveScrim').hidden; })()")
        print("serifu2 confirm while busy:", busy)
        await tp.click('#stayBtn'); await f.click('#recBtn'); await tp.wait_for_timeout(600)
        print("serifu2 play btn:", await f.is_visible('#playBtn'))
        await tp.click('#backBtn'); await tp.click('#leaveBtn'); await tp.wait_for_timeout(1500)
        print("sheet rows:", [(r[2], r[3], r[4], r[5], r[6], r[7]) for r in SHEET])

        # ---------- はずす → スマホは全部の練習 ----------
        await sp.click('#mClear'); await sp.click('#mClear'); await sp.wait_for_timeout(500)
        print("clear:", await sp.inner_text('#mSaveMsg'), MENUS.get('A01'))
        await pg.goto(f"{BASE}"); await pg.wait_for_timeout(1200)
        print("phone after clear:", await pg.evaluate("[document.getElementById('planBox').hidden, [...document.querySelectorAll('#menu .stage')].every(s=>!s.hidden)]"))
        # ---------- 前のスクリプトのまま ----------
        MODE["old"] = True
        await sp.click('#t-data'); await sp.click('#reload'); await sp.wait_for_timeout(600); await sp.click('#t-menu'); await sp.wait_for_timeout(200)
        print("old script msg:", (await sp.inner_text('#mMsg'))[:40])
        await sp.select_option('#mUser', 'B02'); await sp.check('input[data-i="0"][data-f="on"]'); await sp.click('#mSave'); await sp.wait_for_timeout(500)
        print("old save msg:", await sp.inner_text('#mSaveMsg'))
        await sp.click('#t-data'); await sp.click('.user[data-u="A01"]'); await sp.wait_for_timeout(300)
        await sp.screenshot(path=f"{SHOTS}/st_detail.png", full_page=True)
        print("errors:", errs)
        await b.close()
asyncio.run(main())

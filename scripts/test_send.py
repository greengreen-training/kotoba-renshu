import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, json, urllib.parse, datetime
from playwright.async_api import async_playwright
DEP = "AKfycbTESTdeploymentid1234567890abcdef"
BASE = "http://localhost:8770/"
SHEET = []           # 模擬スプレッドシート
POSTS = []
async def gas(route):
    req = route.request
    hdr = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    if req.method == "POST":
        body = json.loads(req.post_data or "{}"); POSTS.append(len(body.get("records", [])))
        known = {r[11] for r in SHEET}; saved = []
        for r in body.get("records", []):
            if not r.get("uid") or not r.get("user"): continue
            saved.append(r["uid"])
            if r["uid"] in known: continue
            known.add(r["uid"])
            SHEET.append([datetime.datetime.utcnow().isoformat()+"Z", r["ts"], r["user"], r["appName"], r["typeName"], r["levelName"], r["score"], r["max"], r["marks"], r["items"], r["sec"], r["uid"]])
        await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": True, "saved": saved}))
    else:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(req.url).query)
        if q.get("key", [""])[0] != "testpass":
            await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": False, "error": "password"})); return
        await route.fulfill(status=200, headers=hdr, body=json.dumps({"ok": True, "rows": SHEET}))

PLAY = """async () => { const d = document.querySelector('#frameWrap iframe').contentDocument;
  for (let i=0;i<10;i++){ let g=0; while(d.getElementById('next').hidden && g++<40){ const en=[...d.querySelectorAll('#choices button:not(:disabled)')]; en[Math.floor(Math.random()*en.length)].click(); }
    d.getElementById('next').click(); }
  return !d.getElementById('result').hidden; }"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        errs = []
        # ---------- 利用者のスマホ ----------
        phone = await b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        await phone.route("https://script.google.com/**", gas)
        pg = await phone.new_page(); pg.on("pageerror", lambda e: errs.append("phone:"+str(e)))
        await pg.goto(f"{BASE}?u=A01&s={DEP}"); await pg.wait_for_timeout(800)
        print("phone me box:", await pg.evaluate("document.getElementById('meId').textContent + ' | ' + document.getElementById('meState').textContent"))
        await pg.click('.app[data-app="joshi"]'); await pg.wait_for_timeout(500)
        fr = pg.frames[1]; await fr.click('.level[data-lv="normal"]'); await pg.wait_for_timeout(200)
        print("played:", await pg.evaluate(PLAY)); await pg.wait_for_timeout(800)
        print("sheet after phone set:", [(r[2], r[3], r[5], r[6], r[8]) for r in SHEET])
        print("  items:", SHEET[-1][9][:90])
        toast = await pg.evaluate("!document.getElementById('toast').hidden && document.getElementById('toast').textContent")
        print("toast:", toast)
        await pg.screenshot(path=f"{SHOTS}/t_phone_result.png")
        # 圏外で1回
        await pg.click('#backBtn'); await pg.wait_for_timeout(200)
        await phone.set_offline(True)
        await pg.click('.app[data-app="nakama"]'); await pg.wait_for_timeout(500)
        await pg.frames[1].click('.level[data-lv="easy"]'); await pg.wait_for_timeout(200)
        await pg.evaluate(PLAY); await pg.wait_for_timeout(600)
        await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        q = await pg.evaluate("JSON.parse(localStorage.getItem('gg.queue')).length")
        print("offline: queue =", q, "| state:", await pg.evaluate("document.getElementById('meState').textContent"), "| sheet rows:", len(SHEET))
        await pg.screenshot(path=f"{SHOTS}/t_phone_offline.png")
        await phone.set_offline(False); await pg.evaluate("window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(1000)
        print("back online: queue =", await pg.evaluate("JSON.parse(localStorage.getItem('gg.queue')).length"), "| sheet rows:", len(SHEET))
        # 二重送信しても1行
        dup = SHEET[-1][11]
        await pg.evaluate(f"""localStorage.setItem('gg.queue', JSON.stringify([{{uid:'{dup}', user:'A01', ts:new Date().toISOString(), appName:'x', typeName:'', levelName:'', score:1, max:1, marks:'', items:'', sec:1}}])); window.dispatchEvent(new Event('online'));""")
        await pg.wait_for_timeout(800)
        print("duplicate resend: sheet rows =", len(SHEET), "| queue =", await pg.evaluate("JSON.parse(localStorage.getItem('gg.queue')).length"))
        # 2回目からはリンクなしで開いても A01
        await pg.goto(BASE); await pg.wait_for_timeout(600)
        print("reopen without link:", await pg.evaluate("document.getElementById('meId').textContent"))

        # ---------- 施設のタブレット ----------
        tab = await b.new_context(viewport={"width":1024,"height":768})
        await tab.route("https://script.google.com/**", gas)
        tp = await tab.new_page(); tp.on("pageerror", lambda e: errs.append("tablet:"+str(e)))
        await tp.goto(f"{BASE}?t=1&s={DEP}"); await tp.wait_for_timeout(800)
        print("tablet picker shown:", await tp.evaluate("!document.getElementById('picker').hidden"))
        await tp.click('#staffBox summary')
        for i, n in [("A01","山田"),("A02","佐藤")]:
            await tp.fill('#rId', i); await tp.fill('#rName', n); await tp.click('#rAdd')
        await tp.screenshot(path=f"{SHOTS}/t_tablet_picker.png")
        await tp.click('.who[data-id="A02"]'); await tp.wait_for_timeout(300)
        print("tablet me:", await tp.evaluate("document.getElementById('meId').textContent + ' ' + document.getElementById('meState').textContent.slice(0,20)"))
        await tp.click('.app[data-app="doushi"]'); await tp.wait_for_timeout(600)
        print("bar who:", await tp.evaluate("document.getElementById('barWho').textContent"), "| GG_USER in app:", await tp.frames[1].evaluate("window.GG_USER"))
        await tp.frames[1].click('.level[data-lv="easy"]'); await tp.evaluate(PLAY); await tp.wait_for_timeout(800)
        await tp.screenshot(path=f"{SHOTS}/t_tablet_result.png")
        print("tablet sheet row:", [(r[2], r[3], r[6], r[8]) for r in SHEET][-1])
        print("best kept per person:", await tp.evaluate("Object.keys(localStorage).filter(k=>k.includes('.best.'))"))
        await tp.click('#backBtn'); await tp.wait_for_timeout(200)
        # 30分たつと選び直し
        await tp.evaluate("const w=JSON.parse(localStorage.getItem('gg.who')); w.at -= 31*60*1000; localStorage.setItem('gg.who', JSON.stringify(w));")
        await tp.goto(BASE); await tp.wait_for_timeout(600)
        print("after 30 min idle -> picker:", await tp.evaluate("!document.getElementById('picker').hidden"))
        await tp.click('.who[data-id="A01"]')
        await tp.click('.app[data-app="gojuon"]'); await tp.wait_for_timeout(500)
        await tp.frames[1].click('.level[data-lv="easy"]'); await tp.evaluate(PLAY); await tp.wait_for_timeout(800)

        # ---------- 職員の成績一覧 ----------
        st = await b.new_context(viewport={"width":1200,"height":900})
        await st.route("https://script.google.com/**", gas)
        sp = await st.new_page(); sp.on("pageerror", lambda e: errs.append("staff:"+str(e)))
        await sp.goto(BASE + "seiseki.html"); await sp.wait_for_timeout(600)
        print("staff opens on setup tab:", await sp.evaluate("!document.getElementById('p-setup').hidden"))
        await sp.fill('#cfgUrl', f"https://script.google.com/macros/s/{DEP}/exec"); await sp.fill('#cfgKey', 'wrong'); await sp.click('#saveCfg'); await sp.wait_for_timeout(600)
        print("wrong password msg:", await sp.evaluate("document.getElementById('loadMsg').textContent"))
        await sp.click('#t-setup'); await sp.fill('#cfgKey', 'testpass'); await sp.click('#saveCfg'); await sp.wait_for_timeout(800)
        print("loaded:", await sp.evaluate("document.getElementById('loadMsg').textContent"), "| users:", await sp.evaluate("[...document.querySelectorAll('.user .id')].map(e=>e.textContent)"))
        await sp.click('.user[data-u="A01"]'); await sp.wait_for_timeout(500)
        await sp.screenshot(path=f"{SHOTS}/t_staff_detail.png", full_page=True)
        await sp.click('#t-links'); await sp.fill('#newId', 'A01'); await sp.fill('#newName', '山田さん'); await sp.click('#addUser'); await sp.wait_for_timeout(400)
        print("link cards:", await sp.evaluate("[...document.querySelectorAll('.qcard .lnk')].map(e=>e.textContent)"))
        await sp.screenshot(path=f"{SHOTS}/t_staff_links.png", full_page=True)
        await b.close()
        print("POST batches:", POSTS, "| errors:", errs[:6])
asyncio.run(main())

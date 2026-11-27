import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, json, urllib.parse, datetime
from playwright.async_api import async_playwright
DEP = "AKfycbTESTdeploymentid1234567890abcdef"
BASE = "http://localhost:8770/"
SHEET, MENUS, AUDS, FILES = [], {}, [], {}
FAIL = {"on": False}
ARGS=["--use-fake-ui-for-media-stream","--use-fake-device-for-media-stream","--autoplay-policy=no-user-gesture-required"]
now = lambda: datetime.datetime.now(datetime.UTC).isoformat()
async def gas(route):
    req = route.request
    if FAIL["on"]: return await route.abort()
    hdr = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    ok = lambda o: route.fulfill(status=200, headers=hdr, body=json.dumps(o))
    if req.method == "POST":
        body = json.loads(req.post_data or "{}")
        a = body.get("action")
        if a == "audio":
            m = MENUS.get(body["user"], {})
            if not m.get("voice"): return await ok({"ok": False, "error": "novoice", "uid": body["uid"]})
            if any(x["uid"] == body["uid"] for x in AUDS): return await ok({"ok": True, "uid": body["uid"], "dup": True})
            fid = "file%d" % (len(FILES) + 1); FILES[fid] = (body["mime"], body["data"])
            AUDS.append({"uid": body["uid"], "row": [now(), body["ts"], body["user"], body["appName"], body["label"], body["dur"], "x", fid, body["uid"]], "size": len(body["data"])})
            return await ok({"ok": True, "uid": body["uid"]})
        if a in ("setmenu", "setvoice"):
            if body.get("key") != "testpass": return await ok({"ok": False, "error": "password"})
            m = MENUS.setdefault(body["user"], {"items": [], "at": "", "voice": False})
            if a == "setvoice": m["voice"] = bool(body["voice"]); return await ok({"ok": True, "user": body["user"], "voice": m["voice"]})
            m["items"] = body["items"]; m["at"] = now(); return await ok({"ok": True, "user": body["user"], "items": body["items"]})
        saved = []
        for r in body.get("records", []):
            saved.append(r["uid"]); SHEET.append([now(), r["ts"], r["user"], r["appName"], r["typeName"], r["levelName"], r["score"], r["max"], r["marks"], r["items"], r["sec"], r["uid"]])
        return await ok({"ok": True, "saved": saved})
    q = urllib.parse.parse_qs(urllib.parse.urlparse(req.url).query)
    if "menu" in q:
        m = MENUS.get(q["menu"][0], {"items": [], "at": "", "voice": False})
        return await ok({"ok": True, "menu": True, "user": q["menu"][0], **m})
    if q.get("key", [""])[0] != "testpass": return await ok({"ok": False, "error": "password"})
    if "audio" in q:
        f = FILES.get(q["audio"][0])
        return await ok({"ok": True, "mime": f[0], "data": f[1]} if f else {"ok": False, "error": "notfound"})
    await ok({"ok": True, "rows": SHEET, "menus": MENUS, "audio": [x["row"] for x in AUDS], "audioFolder": "https://drive.google.com/drive/folders/test"})

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=ARGS)
        errs = []
        st = await b.new_context(viewport={"width":1100,"height":900})
        await st.route("https://script.google.com/**", gas)
        sp = await st.new_page(); sp.on("pageerror", lambda e: errs.append("staff:"+str(e)))
        await sp.goto(BASE + "seiseki.html")
        await sp.evaluate(f"""() => {{ localStorage.setItem('gg.staff.url', JSON.stringify('https://script.google.com/macros/s/{DEP}/exec')); localStorage.setItem('gg.staff.key', JSON.stringify('testpass')); localStorage.setItem('gg.staff.names', JSON.stringify({{A01:'やまださん', B02:'すずきさん'}})); }}""")
        await sp.reload(); await sp.wait_for_timeout(800)
        await sp.click('#t-menu'); await sp.select_option('#mUser', 'A01'); await sp.wait_for_timeout(200)
        await sp.check('#mVoice'); await sp.wait_for_timeout(500)
        print("voice set:", await sp.inner_text('#mVoiceMsg'), MENUS)

        ph = await b.new_context(viewport={"width":390,"height":844}, is_mobile=True, has_touch=True, permissions=["microphone"])
        await ph.route("https://script.google.com/**", gas)
        pg = await ph.new_page(); pg.on("pageerror", lambda e: errs.append("phone:"+str(e)))
        await pg.goto(f"{BASE}?u=A01&s={DEP}"); await pg.wait_for_timeout(1200)
        print("notice gone (menu):", await pg.locator('#meVoice').count() == 0)
        # セリフをいいましょう
        await pg.click('.app[data-app="serifu2"]'); await pg.wait_for_timeout(700); f = pg.frames[1]
        print("notice gone (serifu2):", await f.locator('#voiceNote').count() == 0)
        await f.click('.level[data-lv="easy"]'); await f.click('#recBtn'); await pg.wait_for_timeout(1300); await f.click('#recBtn'); await pg.wait_for_timeout(1500)
        print("after serifu2:", [(x["row"][3], x["row"][4], x["row"][5], x["size"]) for x in AUDS])
        await pg.click('#backBtn'); await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        # 五十音
        await pg.click('.app[data-app="gojuonrec"]'); await pg.wait_for_timeout(700); f = pg.frames[1]
        print("gojuon note:", await f.inner_text('#storeNote'))
        await f.click('.rowbtn[data-row="sa"]'); await f.click('#recBtn'); await pg.wait_for_timeout(1200); await f.click('#recBtn'); await pg.wait_for_timeout(1800)
        print("after gojuonrec:", [(x["row"][3], x["row"][4]) for x in AUDS][-1])
        await pg.click('#backBtn'); await pg.wait_for_timeout(300)
        # 挨拶語
        await pg.click('.app[data-app="aisatsu"]'); await pg.wait_for_timeout(900); f = pg.frames[1]
        await f.click('.char-card >> nth=1'); await pg.wait_for_timeout(500); await f.click('.stage-card >> nth=1'); await pg.wait_for_timeout(600)
        for i in range(4):
            if await f.is_visible('#btn-next-frame'): await f.click('#btn-next-frame'); await pg.wait_for_timeout(300)
        await f.wait_for_selector('#btn-finish', timeout=8000); await pg.wait_for_timeout(1200)
        await f.click('#btn-finish'); await pg.wait_for_timeout(1800)
        print("after aisatsu:", [(x["row"][3], x["row"][4]) for x in AUDS][-1])
        await pg.click('#backBtn'); await pg.click('#leaveBtn') if await pg.is_visible('#leaveBtn') else None; await pg.wait_for_timeout(300)
        # 文をつくろう（普通：なにを → いつ）
        await pg.click('.app[data-app="bun"]'); await pg.wait_for_timeout(700); f = pg.frames[1]
        await f.click('.level[data-lv="normal"]'); await pg.wait_for_timeout(300)
        await f.click('#recBtn'); await pg.wait_for_timeout(1100); await f.click('#recBtn'); await pg.wait_for_timeout(1200)
        await f.click('#stepBtn'); await f.click('#recBtn'); await pg.wait_for_timeout(1100); await f.click('#recBtn'); await pg.wait_for_timeout(1200)
        print("after bun:", [x["row"][4] for x in AUDS][-2:])
        await pg.click('#backBtn'); await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        # 語想起タイムアタック（1つ目のお題を早送り）
        await pg.click('.app[data-app="goso"]'); await pg.wait_for_timeout(700); f = pg.frames[1]
        await f.click('.level[data-lv="easy"]'); await f.click('#goBtn'); await pg.wait_for_timeout(3600)
        await f.evaluate("G.start -= 70000"); await pg.wait_for_timeout(1800)
        print("after goso:", [x["row"][4] for x in AUDS][-1], "| busy confirm:", await pg.evaluate("(() => { document.getElementById('backBtn').click(); return !document.getElementById('leaveScrim').hidden; })()"))
        await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        # 電波なし → ためる → もどったら送る
        FAIL["on"] = True
        await pg.click('.app[data-app="serifu2"]'); await pg.wait_for_timeout(700); f = pg.frames[1]
        await f.click('.level[data-lv="easy"]'); await f.click('#recBtn'); await pg.wait_for_timeout(1100); await f.click('#recBtn'); await pg.wait_for_timeout(1200)
        n0 = len(AUDS); q = await pg.evaluate("(async()=> (await (window.__ggAUD ? window.__ggAUD.list() : Promise.resolve(null))))()")
        print("offline: posted", n0 - 3, "queued(IndexedDB):", await pg.evaluate("""() => new Promise(r => { const q = indexedDB.open('gg-send'); q.onsuccess = () => { const g = q.result.transaction('audio').objectStore('audio').count(); g.onsuccess = () => r(g.result); }; })"""))
        FAIL["on"] = False; await pg.evaluate("window.dispatchEvent(new Event('online'))"); await pg.wait_for_timeout(2500)
        print("online again: posted", len(AUDS) - 3, "queued:", await pg.evaluate("""() => new Promise(r => { const q = indexedDB.open('gg-send'); q.onsuccess = () => { const g = q.result.transaction('audio').objectStore('audio').count(); g.onsuccess = () => r(g.result); }; })"""))
        await pg.click('#backBtn'); await pg.click('#leaveBtn'); await pg.wait_for_timeout(300)
        # 声を送らない人
        p2 = await ph.new_page(); p2.on("pageerror", lambda e: errs.append("phoneB:"+str(e)))
        await p2.goto(f"{BASE}?u=B02&s={DEP}"); await p2.wait_for_timeout(1000)

        await p2.click('.app[data-app="serifu2"]'); await p2.wait_for_timeout(700); f = p2.frames[1]

        n1 = len(AUDS)
        await f.click('.level[data-lv="easy"]'); await f.click('#recBtn'); await p2.wait_for_timeout(1100); await f.click('#recBtn'); await p2.wait_for_timeout(1500)
        print("B02 posted audio:", len(AUDS) - n1)
        # 開いたあとで「声も送る」をオンにしても、開き直さずに届く（設定を読み直す）
        p3 = await ph.new_page(); p3.on("pageerror", lambda e: errs.append("phoneC:"+str(e)))
        await p3.goto(f"{BASE}?u=C03&s={DEP}"); await p3.wait_for_timeout(1000)
        await p3.click('.app[data-app="serifu2"]'); await p3.wait_for_timeout(700); f = p3.frames[1]
        MENUS.setdefault("C03", {"items": [], "at": "", "voice": False})["voice"] = True
        n2 = len(AUDS)
        await f.click('.level[data-lv="easy"]'); await f.click('#recBtn'); await p3.wait_for_timeout(1100); await f.click('#recBtn'); await p3.wait_for_timeout(2500)
        print("C03 (turned on after opening) posted:", len(AUDS) - n2)
        # 職員：聞く
        await sp.click('#t-data'); await sp.click('#reload'); await sp.wait_for_timeout(700)
        await sp.click('.user[data-u="A01"]'); await sp.wait_for_timeout(400)
        print("staff recs rows (expect 7):", await sp.locator('.recs tbody tr').count(), "| pills:", await sp.inner_text('.user[data-u="A01"] .meta >> nth=1'))
        await sp.locator('[data-aud]').first.click(); await sp.wait_for_timeout(400)
        print("play button:", await sp.locator('[data-aud]').first.inner_text())
        await sp.screenshot(path=f"{SHOTS}/st_recs.png", full_page=True)
        print("errors:", errs)
        await b.close()
asyncio.run(main())

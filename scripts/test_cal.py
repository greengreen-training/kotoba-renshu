import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, json, urllib.parse, datetime, random
from playwright.async_api import async_playwright
DEP = "AKfycbTESTdeploymentid1234567890abcdef"
BASE = "http://localhost:8770/"
random.seed(3)
now = datetime.datetime(2026, 11, 24, 15, 0)
ROWS = []
apps = [("ことば並べ替え（初級）","","普通"),("助詞の練習","","普通"),("動詞の練習","","普通"),("挨拶語のトレーニング","朝の挨拶","録音"),("絵合わせ","色","簡単"),("風船ことば","","普通（2〜3文字・3択）"),("語想起タイムアタック","カテゴリ","簡単")]
for back in [0,0,0,1,3,3,5,8,8,8,8,12,15,20,22,30,31]:
    a = random.choice(apps); t = now - datetime.timedelta(days=back, hours=random.randint(0,5))
    if a[2] == "録音" or a[0] == "語想起タイムアタック":
        ROWS.append([t.isoformat(), t.isoformat(), "3", a[0], a[1], a[2], 1, 0, "", "おはようございます／いってきます", 120, "u%d" % len(ROWS)])
    else:
        marks = "".join(random.choice("〇〇〇△×") for _ in range(10)); sc = sum(1 if m=="〇" else 0.5 if m=="△" else 0 for m in marks)
        items = "／".join(f"ことば{i+1}{m}（{round(random.uniform(1.5,9),1)}秒{'・えらんだ：' + random.choice(['いぬ','ねこ、とり','さる']) if m!='〇' else ''}）" for i,m in enumerate(marks))
        if back > 25: items = "／".join(f"ことば{i+1}{m}" for i,m in enumerate(marks))
        ROWS.append([t.isoformat(), t.isoformat(), "3", a[0], a[1], a[2], sc, 10, marks, items, 300, "u%d" % len(ROWS)])
AUD = [[now.isoformat(), (now - datetime.timedelta(hours=1)).isoformat(), "3", "挨拶語のトレーニング", "朝の挨拶・おはようございます", 2.1, "x", "f1", "a1"]]
async def gas(route):
    q = urllib.parse.parse_qs(urllib.parse.urlparse(route.request.url).query)
    await route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
        body=json.dumps({"ok": True, "rows": ROWS, "menus": {"3": {"items": [], "at": "", "voice": True}}, "audio": AUD, "audioFolder": ""}))
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        for W in (1100, 390):
            ctx = await b.new_context(viewport={"width": W, "height": 900}); await ctx.route("https://script.google.com/**", gas)
            pg = await ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(BASE + "seiseki.html")
            await pg.evaluate(f"""() => {{ localStorage.setItem('gg.staff.url', JSON.stringify('https://script.google.com/macros/s/{DEP}/exec')); localStorage.setItem('gg.staff.key', JSON.stringify('pw')); localStorage.setItem('gg.staff.names', JSON.stringify({{'3':'nomura'}})); localStorage.setItem('gg.staff.range', JSON.stringify('0')); }}""")
            await pg.reload(); await pg.wait_for_timeout(500); await pg.click('#reload'); await pg.wait_for_timeout(500)
            await pg.click('.user[data-u="3"]'); await pg.wait_for_timeout(300)
            await pg.click('.cal-d[data-day="2026-11-24"]'); await pg.wait_for_timeout(300)
            await pg.locator('.cal-day .rec-row.has-q').first.click(); await pg.wait_for_timeout(200)
            await pg.locator('#detail').screenshot(path=f"{SHOTS}/cal_{W}.png")
            print(W, "month:", await pg.inner_text('.cal-top h3'), "| days with marks:", await pg.locator('.cal-d.c1, .cal-d.c2, .cal-d.c3').count(), "| q-table rows:", await pg.locator('.cal-day .q-row:not([hidden]) .qtbl tbody tr').count())
            await pg.click('[data-cal="-1"]'); await pg.wait_for_timeout(200); print(W, "prev:", await pg.inner_text('.cal-top h3'), await pg.inner_text('.cal-top .sum'))
            print("errors", errs)
        await b.close()
asyncio.run(main())

import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, re
from playwright.async_api import async_playwright
FILE={"onin":"oto"}
IDS=["eawase","onin","oto2","gojuon","narabe","nakama","fusen","setsumei","meishi","joshi","doushi","doushi2","bun","serifu","serifu2"]
def expected(k):
    h=open(f"{ROOT}/src/gg/{FILE.get(k,k)}.html").read()
    return re.sub(r"<html(?=[\s>])", '<html data-theme="light"', h, count=1, flags=re.I)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path=CHROME)
        errs=[]
        ctx=await b.new_context(viewport={"width":1100,"height":860})
        page=await ctx.new_page()
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto("http://localhost:8765/index.html"); await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{SHOTS}/s_menu.png", full_page=True)
        for k in IDS:
            await page.click(f'.app[data-app="{k}"]'); await page.wait_for_timeout(700)
            sd = await page.evaluate("document.querySelector('#frameWrap iframe').srcdoc")
            sd = re.sub(r"<script>window\.GG_USER=[^<]*</script>", "", sd, count=1)
            same = sd == expected(k)
            fr=page.frames[1]
            if k in ("fusen","setsumei"): await fr.click("#startBtn")
            else:
                if k=="eawase": await fr.click('.type[data-type="shape"]')
                await fr.click('.level[data-lv="hard"]' if k in ("gojuon","eawase","narabe") else '.level[data-lv="normal"]')
            await page.wait_for_timeout(900)
            if k in ("eawase","gojuon","narabe","nakama","fusen","doushi"):
                await page.screenshot(path=f"{SHOTS}/s_{k}.png")
            await page.click("#backBtn"); await page.wait_for_timeout(250)
            dlg = await page.evaluate("!document.getElementById('leaveScrim').hidden")
            await page.click("#leaveBtn"); await page.wait_for_timeout(250)
            ok = await page.evaluate("!document.getElementById('menu').hidden && !document.querySelector('#frameWrap iframe')")
            print(f"{k:8s} srcdoc==built:{same} confirm-while-busy:{dlg} back-to-menu:{ok}")
        m=await b.new_context(viewport={"width":390,"height":844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        mp=await m.new_page(); mp.on("pageerror", lambda e: errs.append(str(e)))
        await mp.goto("http://localhost:8765/index.html#narabe"); await mp.wait_for_timeout(1000)
        await mp.frames[1].click('.level[data-lv="normal"]'); await mp.wait_for_timeout(800)
        await mp.screenshot(path=f"{SHOTS}/s_m_narabe.png")
        await mp.goto("http://localhost:8765/index.html#oto"); 
        await mp.goto("http://localhost:8765/index.html#onin"); await mp.wait_for_timeout(1000)
        await mp.frames[1].click('.level[data-lv="easy"]'); await mp.wait_for_timeout(800)
        await mp.screenshot(path=f"{SHOTS}/s_m_onin.png")
        await b.close()
        print("errors:", errs[:10])
asyncio.run(main())

import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio, json
from playwright.async_api import async_playwright
APPS = {"oto2":[None],"nakama":[None],"meishi":[None],"gojuon":[None],"narabe":[None],"narabe2":[None],"eawase":["word","pic","shape","color","mix"],"oto":["single","all"],"joshi":[None],"doushi2":["use","form","mix"],"doushi":[None]}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        ctx = await b.new_context(viewport={"width":900,"height":900})
        errs = []
        page = await ctx.new_page()
        page.on("pageerror", lambda e: errs.append(str(e)))
        for app, types in APPS.items():
            await page.goto(f"http://localhost:8766/{app}.html"); await page.wait_for_timeout(300)
            for t in types:
                for lv in ["easy","normal","hard"]:
                    if t: await page.click(f'.type[data-type="{t}"]')
                    await page.click(f'.level[data-lv="{lv}"]')
                    stats = await page.evaluate("""async () => {
                      const out = {n:S.qs.length, bad:[]};
                      for (let i=0;i<S.qs.length;i++){
                        const opts=[...document.querySelectorAll('#choices button')].map(b=>b.textContent.trim()+'|'+b.innerHTML.length);
                        const texts=[...document.querySelectorAll('#choices button')].map(b=>b.innerHTML);
                        if (new Set(texts).size!==texts.length && !document.querySelector('#choices.tiles') && S.type!=='all') out.bad.push('dup options q'+i);
                        let guard=0;
                        while(document.getElementById('next').hidden && guard++<40){
                          const en=[...document.querySelectorAll('#choices button:not(:disabled)')];
                          if(!en.length){out.bad.push('stuck q'+i);break;}
                          en[Math.floor(Math.random()*en.length)].click();
                        }
                        document.getElementById('next').click();
                      }
                      out.result=!document.getElementById('result').hidden;
                      out.score=document.getElementById('rScore').textContent;
                      return out;}""")
                    print(f"{app:7s} {str(t):7s} {lv:6s} n={stats['n']} result={stats['result']} {stats['score']} bad={stats['bad'][:3]}")
                    await page.click('#home')
        await b.close()
        print("page errors:", errs[:10])
asyncio.run(main())

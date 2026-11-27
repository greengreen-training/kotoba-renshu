import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import asyncio
from playwright.async_api import async_playwright
CHECKS = {
"gojuon": """(() => { const bad=[]; for (const lv of ['easy','normal','hard']) for (let t=0;t<200;t++){ const qs=APP.make(lv); if(qs.length!==10) bad.push(lv+' len '+qs.length);
  for (const q of qs){ const n={easy:3,normal:6,hard:10}[lv], k={easy:1,normal:2,hard:5}[lv]; if(q.ans.length!==k||new Set(q.ans).size!==k||q.opts.length!==n||new Set(q.opts).size!==n||!q.ans.every(a=>q.opts.includes(a))) bad.push(lv+' '+q.ans+' '+q.opts); } } return bad.slice(0,5); })()""",
"nakama": """(() => { const bad=[]; const catOf={}; for(const k in CATS) CATS[k].items.forEach(it=>catOf[it[0]]=k);
  for (const lv of ['easy','normal','hard']) for (let t=0;t<200;t++) for (const q of APP.make(lv)){ const L=NK[lv];
   if(q.cards.length!==L.n) bad.push(lv+' n '+q.cards.length+' '+q.c);
   if(new Set(q.cards.map(c=>c.it[0])).size!==q.cards.length) bad.push('dup'); if(new Set(q.cards.map(c=>P(c.it[1]))).size!==q.cards.length) bad.push('dup label '+q.cards.map(c=>P(c.it[1])));
   for(const cd of q.cards){ const k=catOf[cd.it[0]]; if(cd.hit && k!==q.c) bad.push('hit wrong'); if(!cd.hit){ if(k===q.c) bad.push('target as distractor'); if((NOT_WITH[q.c]||[]).includes(k)) bad.push('excluded '+q.c+' '+k); if(cd.it[2]&&cd.it[2].includes(q.c)) bad.push('flagged '+cd.it[1]); if(lv==='easy'&&CATS[k].fam===CATS[q.c].fam) bad.push('easy same fam '+q.c+' '+k);} } }
  return bad.slice(0,5); })()""",
"eawase": """(() => { const bad=[]; for (const ty of ['word','pic','shape','color']) for (const lv of ['easy','normal','hard']) for (let t=0;t<300;t++){ const q=makeQ(ty,lv); const n={easy:3,normal:4,hard:6}[lv];
   const key=o=>Array.isArray(o)?o[0]:o; const ks=q.opts.map(key);
   if(q.opts.length!==n||new Set(ks).size!==n||!q.opts.includes(q.target)) bad.push(ty+' '+lv+' '+ks.join(''));
   if(ty==='word' && new Set(q.opts.map(o=>o[1])).size!==n) bad.push('dup word'); }
   for (const k of Object.keys(SHAPES)) if(!SHAPES[k]) bad.push('shape '+k); return bad.slice(0,5); })()""",
"narabe": """(() => { const bad=[]; for (const lv of ['easy','normal','hard']) for (let t=0;t<200;t++) for (const q of APP.make(lv)){ const w=q.word.split(''); const extra=q.tiles.slice(); for(const c of w){ const i=extra.indexOf(c); if(i<0) bad.push('missing '+q.word); else extra.splice(i,1);} if(extra.length!==NB[lv].extra) bad.push('extra count '+q.word); for(const e of extra) if(w.includes(e)) bad.push('extra in word '+q.word+e); if(/[ゃゅょっー]/.test(q.word)) bad.push('small '+q.word);} return bad.slice(0,5); })()""",
"narabe2": """(() => { const bad=[]; for (const lv of ['easy','normal','hard']) for (let t=0;t<300;t++) for (const q of APP.make(lv)){ const w=[...q.word]; const extra=q.tiles.slice(); for(const c of w){ const i=extra.indexOf(c); if(i<0) bad.push('missing '+q.word); else extra.splice(i,1);} if(extra.length!==NB2[lv].extra) bad.push('extra count '+q.word); for(const e of extra){ if(w.includes(e)) bad.push('extra in word '+q.word+e); if(/[ァ-ヶー]/.test(q.word)!==/[ァ-ヶー]/.test(e) && e!=='ー') bad.push('script '+q.word+e);} if(!/[ゃゅょっャュョッー]/.test(q.word)) bad.push('no special '+q.word);} const all={}; for(const lv in NB2) for(const [e,w] of NB2[lv].words){ if(all[w]) bad.push('dup word '+w); all[w]=1; } return bad.slice(0,6); })()""",
"meishi": """(() => { const bad=[]; for (const lv of ['easy','normal','hard']) { const n={easy:3,normal:4,hard:4}[lv]; if (MS[lv].length<10) bad.push(lv+' too few'); for (const q of MS[lv]) { const o=[q.a].concat(q.d); if(o.length!==n||new Set(o).size!==n) bad.push(lv+' '+q.s); } } return bad; })()""",
"doushi2": """(() => { const bad=[]; const N={use:{easy:3,normal:3,hard:4},form:{easy:2,normal:3,hard:4}};
  for (const k of ['use','form']) for (const lv of ['easy','normal','hard']) {
    const L = DV[k][lv]; if (L.length < 10) bad.push(k+lv+' too few '+L.length);
    const seen = new Set();
    L.forEach((q,i) => { const t = P(q.s); if ((q.s.match(/＠/g)||[]).length !== 1) bad.push(k+lv+i+' blank');
      if (seen.has(t+'|'+q.a)) bad.push(k+lv+i+' dup'); seen.add(t+'|'+q.a);
      if (1 + q.d.length !== N[k][lv]) bad.push(k+lv+i+' opts '+(1+q.d.length));
      if (q.d.includes(q.a) || new Set(q.d).size !== q.d.length) bad.push(k+lv+i+' same');
      if (/\[[^\]]*[^ぁ-ゖー\]][^\]]*\]/.test(q.s + q.a + q.d.join(''))) bad.push(k+lv+i+' ruby');
      if (q.k !== k) bad.push(k+lv+i+' k'); }); }
  for (const t of ['use','form','mix']) for (const lv of ['easy','normal','hard']) for (let r=0;r<50;r++) {
    const qs = APP.make(lv, t); if (qs.length !== 10) bad.push(t+lv+' len '+qs.length);
    qs.forEach(q => { if (!q.opts.includes(q.a) || new Set(q.opts).size !== q.opts.length) bad.push(t+lv+' opts'); });
    if (t === 'mix' && qs.filter(q => q.k === 'use').length !== 5) bad.push('mix half'); }
  return bad.slice(0, 10); })()""",
"doushi": """(() => { const bad=[]; for (const lv of ['easy','normal','hard']) for (let t=0;t<300;t++){ const qs=APP.make(lv); if(qs.length!==10) bad.push('len'); qs.forEach((q,i)=>{ if(q.pairId&&q.pairOrder===2){ if(!(i>0&&qs[i-1].pairId===q.pairId&&qs[i-1].pairOrder===1)) bad.push('pair broken'); if(!q.prev) bad.push('no prev'); } if(q.pairId&&q.pairOrder===1&&!(qs[i+1]&&qs[i+1].pairId===q.pairId)) bad.push('pair1 alone'); }); } return bad.slice(0,5); })()""",
}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME)
        page = await b.new_page()
        for app, js in CHECKS.items():
            await page.goto(f"http://localhost:8766/{app}.html"); await page.wait_for_timeout(200)
            print(app, await page.evaluate(js))
        await b.close()
asyncio.run(main())

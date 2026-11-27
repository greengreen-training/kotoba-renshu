import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
CHROME = _os.environ.get("CHROME") or ("/usr/bin/google-chrome" if _os.path.exists("/usr/bin/google-chrome") else None)
SHOTS = f"{ROOT}/test_shots"; _os.makedirs(SHOTS, exist_ok=True)
import json
from playwright.sync_api import sync_playwright
B = "http://localhost:8766/"
CASES = [
 ("eawase", {"lv":"easy","type":"word","opts":5,"n":4}, "(() => { const qs = APP.make('easy','word'); return [qs.length, [...new Set(qs.map(q=>q.opts.length))]]; })()", [4,[5]]),
 ("eawase", {"lv":"normal","type":"shape","opts":2}, "(() => { const qs = APP.make('normal','shape'); return [qs.length, [...new Set(qs.map(q=>q.opts.length))]]; })()", [10,[2]]),
 ("eawase", {"lv":"hard","type":"color","opts":3}, "(() => { const qs = APP.make('hard','color'); return [qs.length, [...new Set(qs.map(q=>q.opts.length))]]; })()", [10,[3]]),
 ("oto2", {"lv":"easy","opts":4}, "(() => { const qs = APP.make('easy'); return [...new Set(qs.map(q=>q.opts.length))]; })()", [4]),
 ("gojuon", {"lv":"easy","opts":4}, "(() => { const qs = APP.make('easy'); return [...new Set(qs.map(q=>q.opts.length))]; })()", [4]),
 ("gojuon", {"lv":"hard","opts":2}, "(() => { const qs = APP.make('hard'); return [...new Set(qs.map(q=>q.opts.length))]; })()", [6]),
 ("narabe", {"lv":"hard","opts":0}, "(() => { const qs = APP.make('hard'); return qs.every(q => q.tiles.length === q.word.length); })()", True),
 ("narabe2", {"lv":"easy","opts":3}, "(() => { const qs = APP.make('easy'); return qs.every(q => q.tiles.length === [...q.word].length + 3); })()", True),
 ("nakama", {"lv":"normal","opts":5,"n":6,"topics":["fruit","veg"]}, "(() => { const qs = APP.make('normal'); return [qs.length, [...new Set(qs.map(q=>q.c))].sort(), [...new Set(qs.map(q=>q.cards.length))], [...new Set(qs.map(q=>q.cards.filter(c=>c.hit).length))]]; })()", [6,["fruit","veg"],[5],[3]]),
 ("nakama", {"lv":"hard","opts":4,"topics":["fruit"]}, "(() => { const qs = APP.make('hard'); return [...new Set(qs.map(q=>q.cards.length))]; })()", [4]),
 ("nakama", {"lv":"hard","opts":10}, "(() => { const qs = APP.make('hard'); return [...new Set(qs.map(q=>q.cards.length))]; })()", [10]),
 ("meishi", {"lv":"hard","opts":2}, "(() => [...new Set(APP.make('hard').map(q=>q.opts.length))])()", [2]),
 ("joshi", {"lv":"hard","opts":2}, "(() => [...new Set(APP.make('hard').map(q=>q.opts.length))])()", [2]),
 ("doushi", {"lv":"hard","opts":2,"n":6}, "(() => { const qs = APP.make('hard'); return [qs.length, [...new Set(qs.map(q=>q.opts.length))]]; })()", [6,[2]]),
 ("serifu", {"lv":"easy","opts":2,"topics":["タクシーで","スーパーで"]}, "(() => { const qs = APP.make('easy'); return [qs.map(q=>P(q.t)).sort(), [...new Set(qs.map(q=>q.opts.length))]]; })()", [["スーパーで","タクシーで"],[2]]),
 ("serifu2", {"lv":"hard","topics":["タクシーで"]}, "(() => APP.make('hard').map(q=>P(q.t)))()", ["タクシーで"]),
 ("bun", {"lv":"hard","topics":["家で","けさ"]}, "(() => APP.make('hard','place').map(q=>P(q.k)).sort())()", ["けさ","家で"]),
 ("bun", {"lv":"easy","n":2}, "(() => APP.make('easy','time').length)()", 2),
]
def main():
    bad = 0
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        for app, fix, js, want in CASES:
            ctx = b.new_context(); errs = []
            ctx.add_init_script("window.GG_FIX = " + json.dumps(fix) + ";")
            pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(B + app + ".html"); pg.wait_for_timeout(400)
            got = None
            for _ in range(3):
                got = pg.evaluate(js)
                if got == want: break
            ok = got == want and not errs
            bad += not ok
            print("OK " if ok else "NG ", app, json.dumps(fix, ensure_ascii=False), "->", got, "" if ok else "want " + str(want), errs[:2])
            ctx.close()
        # 画面で確かめる練習
        def page(app, fix):
            ctx = b.new_context(); ctx.add_init_script("window.GG_FIX = " + json.dumps(fix) + ";")
            pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.goto(B + app + ".html"); pg.wait_for_timeout(1200); return ctx, pg, errs
        ctx, pg, errs = page("goso", {"lv":"easy","type":"cat","topics":["cat:魚","cat:台所に ある もの","onset:か"],"n":2})
        r = pg.evaluate("[G && G.items.map(o=>P(o.w)), $('qno').textContent]")
        ok = r[0] is not None and len(r[0]) == 2 and set(r[0]) <= {"魚","台所に ある もの"} and r[1].endswith("/ 2") and not errs
        bad += not ok; print("OK " if ok else "NG ", "goso topics", r, errs[:2]); ctx.close()
        ctx, pg, errs = page("goso", {"lv":"normal","type":"onset","topics":["onset:ぬ"]})
        r = pg.evaluate("[G.items.map(o=>o.w), $('qno').textContent]")
        ok = r == [["ぬ"], "1 / 1"] and not errs; bad += not ok; print("OK " if ok else "NG ", "goso onset", r, errs[:2]); ctx.close()
        ctx, pg, errs = page("gojuonrec", {"lv":"","topics":["ka","pa"]})
        r = pg.evaluate("[[...document.querySelectorAll('#rows .rowbtn, #rowsD .rowbtn')].map(b=>b.dataset.row), document.getElementById('dakuBox').hidden, document.getElementById('dakuBtn').hidden]")
        ok = r == [["ka","pa"], False, True] and not errs; bad += not ok; print("OK " if ok else "NG ", "gojuonrec rows", r, errs[:2]); ctx.close()
        ctx, pg, errs = page("aisatsu", {"lv":"","topics":["morning","meal"]})
        r = pg.evaluate("document.querySelectorAll('#stage-grid .stage-card').length")
        ok = r == 2 and not errs; bad += not ok; print("OK " if ok else "NG ", "aisatsu stages", r, errs[:2]); ctx.close()
        ctx, pg, errs = page("aisatsu", {})
        r = pg.evaluate("document.querySelectorAll('#stage-grid .stage-card').length")
        ok = r == 8 and not errs; bad += not ok; print("OK " if ok else "NG ", "aisatsu all", r, errs[:2]); ctx.close()
        for app in ["fusen", "setsumei"]:
            ctx, pg, errs = page(app, {"lv":"easy","opts":2,"n":4})
            pg.wait_for_timeout(1500)
            r = pg.evaluate("[document.querySelectorAll('#choices .choice, #choices button').length, document.getElementById('qno').textContent]")
            ok = r[0] == 2 and r[1].endswith('/4') and not errs; bad += not ok; print("OK " if ok else "NG ", app, r, errs[:2]); ctx.close()
        # 何も決めていないときは いつもどおり
        ctx, pg, errs = page("nakama", {})
        r = pg.evaluate("(() => { const qs = APP.make('easy'); return [qs.length, [...new Set(qs.map(q=>q.cards.length))]]; })()")
        ok = r == [10, [6]] and not errs; bad += not ok; print("OK " if ok else "NG ", "nakama default", r); ctx.close()
        b.close()
    print("BAD", bad)
main()

import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
import re
N = f"{ROOT}/newapps"; SRC = f"{ROOT}/src"; OUT = f"{ROOT}/src/gg"; _os.makedirs(OUT, exist_ok=True)
import os; os.makedirs(OUT, exist_ok=True)
def R(s): return re.sub(r"([一-鿿々〆ヶ]+)\[([ぁ-ゖー]+)\]", r"<ruby>\1<rt>\2</rt></ruby>", s)
def rd(p): return open(p, encoding="utf-8").read()
common_css, common_js, shell = rd(f"{N}/common.css"), rd(f"{N}/common.js"), rd(f"{N}/shell.html")

# 元のアプリからデータ部分をそのまま取り出す
onin = rd(f"{SRC}/onin.html").split("\n")
onin_data = "\n".join(onin[268:436])          # 269〜436行：説明・DATA・SVGS・効果音・読み上げ
assert onin_data.lstrip().startswith("/*") and "const DATA" in onin_data and "function speak" in onin_data and "const $" not in onin_data
joshi_line = [l for l in rd(f"{SRC}/joshi.html").split("\n") if l.startswith("const DIFFS")][0]
dou = rd(f"{SRC}/doushi.html").split("\n")
dou_data = "\n".join(dou[303:389] + [""] + dou[417:451])  # 304〜389行（VERBS〜DATASETS）＋418〜451行（buildQuestionOrder）
assert "const VERBS" in dou_data and "const DATASETS" in dou_data and "function buildQuestionOrder" in dou_data and "function shuffle" not in dou_data
# 問題数は共通のしくみの SET_SIZE（人ごとに職員が決められる）を使う
assert dou_data.count("  const SET_SIZE = 10;\n") == 1
dou_data = dou_data.replace("  const SET_SIZE = 10;\n", "")

serifu_js = rd(f"{N}/apps/serifu.js")
serifu_data = serifu_js[:serifu_js.index("const SL =")]
assert "const SCENES" in serifu_data and "function sceneHTML" in serifu_data and "function speakJa" in serifu_data
rec_js = rd(f"{N}/rec.js")
SPEECH_GLYPH = '<svg viewBox="0 0 40 40"><path d="M5 7h22a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H15l-7 6v-6H5a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z" fill="currentColor"/><rect x="31" y="14" width="6" height="11" rx="3" fill="currentColor"/><path d="M28.5 22a5.5 5.5 0 0 0 11 0M34 28v5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'

APPS = {
 "nakama": dict(js=f"{N}/apps/nakama.js", css=f"{N}/apps/nakama.css", plain="仲間えらび", title=R("仲間[なかま]えらび"),
   glyph='<svg viewBox="0 0 40 40"><circle cx="14" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="26" cy="15" r="9" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="26" r="9" fill="none" stroke="currentColor" stroke-width="3"/></svg>',
   lead=R("お題[だい]（くだもの・乗[の]り物[もの] など）の 仲間[なかま]を ぜんぶ えらぶ 練習[れんしゅう]です。")),
 "meishi": dict(js=f"{N}/apps/meishi.js", css=None, plain="名詞の練習", title=R("名詞[めいし]の 練習[れんしゅう]"), glyph="本",
   lead=R("「＿＿を 飲[の]む」の ように、2つの ことばの 文[ぶん]に 合[あ]う ことばを えらぶ 練習[れんしゅう]です。")),
 "gojuon": dict(js=f"{N}/apps/gojuon.js", css=f"{N}/apps/gojuon.css", plain="50音ならべ", title=R("50音[おん]ならべ"),
   glyph='<svg viewBox="0 0 40 40"><g fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="2"/><rect x="15" y="3" width="10" height="10" rx="2"/><rect x="27" y="3" width="10" height="10" rx="2"/><rect x="3" y="15" width="10" height="10" rx="2"/><rect x="27" y="15" width="10" height="10" rx="2"/><rect x="3" y="27" width="10" height="10" rx="2"/><rect x="15" y="27" width="10" height="10" rx="2"/><rect x="27" y="27" width="10" height="10" rx="2"/></g><rect x="16" y="16" width="8" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/></svg>',
   lead=R("50音表[おんひょう]の あいている マスに 入[はい]る 字[じ]を えらぶ 練習[れんしゅう]です。")),
 "eawase": dict(js=f"{N}/apps/eawase.js", css=f"{N}/apps/eawase.css", plain="絵合わせ", title=R("絵[え]合[あ]わせ"),
   glyph='<svg viewBox="0 0 40 40"><circle cx="11" cy="12" r="7.5" fill="currentColor"/><path d="M29 4l8.5 15h-17z" fill="currentColor"/><rect x="12.5" y="23" width="15" height="15" rx="2.5" fill="currentColor"/></svg>',
   lead=R("お手本[てほん]と 同[おな]じ ものを えらぶ 練習[れんしゅう]です。しゅるいと 難[むずか]しさを えらんで ください。")),
 "narabe": dict(js=f"{N}/apps/narabe.js", css=f"{N}/apps/narabe.css", plain="ことば並べ替え（初級）", title=R("ことば 並[なら]べ替[か]え") + '<span class="t-grade">' + R("初級[しょきゅう]") + '</span>', glyph="ねこ",
   lead=R("絵[え]カードを 見[み]て、バラバラの 字[じ]を ならべて ことばを つくる 練習[れんしゅう]です。")),
 "narabe2": dict(js=f"{N}/apps/narabe2.js", css=f"{N}/apps/narabe2.css", plain="ことば並べ替え（上級）", title=R("ことば 並[なら]べ替[か]え") + '<span class="t-grade">' + R("上級[じょうきゅう]") + '</span>', glyph="っ",
   lead=R("絵[え]カードを 見[み]て、小[ちい]さい「ゃ・ゅ・ょ・っ」や のばす 音[おと]「ー」の 入[はい]った ことばを、字[じ]を ならべて つくる 練習[れんしゅう]です。")),
 "serifu": dict(js=f"{N}/apps/serifu.js", css=f"{N}/apps/serifu.css", plain="セリフをえらびましょう", title=R("セリフを えらびましょう"),
   glyph='<svg viewBox="0 0 40 40"><path d="M5 7h22a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H15l-7 6v-6H5a4 4 0 0 1-4-4V11a4 4 0 0 1 4-4z" fill="currentColor"/><path d="M33 14h2a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-1v5l-6-5h-9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>',
   lead=R("場面[ばめん]の 絵[え]を 見[み]て、「あなた」の 吹[ふ]き出[だ]しに 入[はい]る セリフを えらぶ 練習[れんしゅう]です。") + '<span class="me-pick" role="group" aria-label="あなたの絵">' + R("あなたの 絵[え]：") + '<button type="button" data-me="f" aria-pressed="true">' + R("女性[じょせい]") + '</button><button type="button" data-me="m" aria-pressed="false">' + R("男性[だんせい]") + '</button></span>'),
 "serifu2": dict(js=f"{N}/apps/serifu2.js", css=[f"{N}/apps/serifu.css", f"{N}/apps/serifu2.css"], plain="セリフをいいましょう", title=R("セリフを いいましょう"),
   glyph=SPEECH_GLYPH,
   lead=R("場面[ばめん]の 絵[え]を 見[み]て、「あなた」の セリフを 声[こえ]に 出[だ]して 言[い]う 練習[れんしゅう]です。録音[ろくおん]して 自分[じぶん]の 声[こえ]を 聞[き]き返[かえ]し、お手本[てほん]と くらべて「言[い]えた・言[い]えなかった」を つけます。") + '<span class="me-pick" role="group" aria-label="あなたの絵">' + R("あなたの 絵[え]：") + '<button type="button" data-me="f" aria-pressed="true">' + R("女性[じょせい]") + '</button><button type="button" data-me="m" aria-pressed="false">' + R("男性[だんせい]") + '</button></span>',
   fill={"/*@@SERIFU_DATA@@*/": serifu_data, "/*@@REC@@*/": rec_js}),
 "bun": dict(js=f"{N}/apps/bun.js", css=f"{N}/apps/bun.css", plain="文をつくろう", title=R("文[ぶん]を つくろう") + '<span class="t-grade">' + R("録音[ろくおん]") + '</span>',
   glyph='<svg viewBox="0 0 40 40"><rect x="2" y="13" width="10" height="14" rx="3" fill="currentColor"/><rect x="15" y="13" width="10" height="14" rx="3" fill="currentColor" opacity=".75"/><rect x="28" y="13" width="10" height="14" rx="3" fill="currentColor" opacity=".5"/></svg>',
   lead=R("「家[いえ]で したこと」などの 質問[しつもん]に、「わたしは いつ どこで なにを しました」の 形[かたち]で 声[こえ]で こたえる 練習[れんしゅう]です。録音[ろくおん]して 聞[き]き返[かえ]せます。普通[ふつう]では「いつ？」「どこで？」と 1つずつ 聞[き]かれ、さいごに つなげて 長[なが]い 文[ぶん]に します。問題[もんだい]は「場所[ばしょ]から（家[いえ]で など）」「時間[じかん]から（朝[あさ]・夜[よる] など）」「人[ひと]・ことから（家族[かぞく]と など）」から えらべます。"),
   fill={"/*@@REC@@*/": rec_js, "/*@@BUN_TOPICS@@*/": rd(f"{N}/apps/bun_topics.js")}),
 "oto2": dict(js=f"{N}/ports/oto2.js", css=f"{N}/ports/oto2.css", plain="音を選ぶ練習（上級）", title=R("音[おと]を 選[えら]ぶ 練習[れんしゅう]") + '<span class="t-grade">' + R("上級[じょうきゅう]") + '</span>', glyph="あ？",
   lead=R("絵[え]と 漢字[かんじ]を 見[み]て、ことばの 中[なか]の 2つの 空白[くうはく]に 入[はい]る 音[おと]を えらぶ 練習[れんしゅう]です。どちらの 空白[くうはく]から 埋[う]めても かまいません。"),
   fill={"/*@@ONIN_DATA@@*/": onin_data}),
 "oto": dict(js=f"{N}/ports/oto.js", css=f"{N}/ports/oto.css", plain="音を選ぶ練習", title=R("音[おと]を 選[えら]ぶ 練習[れんしゅう]"), glyph="あ",
   lead=R("絵[え]と 漢字[かんじ]を 見[み]て、ことばの 音[おと]を えらぶ 練習[れんしゅう]です。こたえた あとに ことばを 読[よ]み上[あ]げます。"),
   fill={"/*@@ONIN_DATA@@*/": onin_data}),
 "joshi": dict(js=f"{N}/ports/joshi.js", css=f"{N}/ports/joshi.css", plain="助詞の練習", title=R("助詞[じょし]の 練習[れんしゅう]"), glyph="を",
   lead=R("文[ぶん]に 合[あ]う「が・を・に」などを えらぶ 練習[れんしゅう]です。"),
   fill={"/*@@JOSHI_DATA@@*/": joshi_line}),
 "doushi2": dict(js=f"{N}/apps/doushi2.js", css=None, plain="動詞の練習（上級）", title=R("動詞[どうし]の 練習[れんしゅう]（上級[じょうきゅう]）"), glyph="開く",
   lead=R("にた 動詞[どうし]の 使[つか]い分[わ]け（窓[まど]が 開[あ]く／窓[まど]を 開[あ]ける など）と、文[ぶん]に 合[あ]う 動詞[どうし]の かたち（見[み]ます／見[み]ました など）を えらぶ 練習[れんしゅう]です。")),
 "doushi": dict(js=f"{N}/ports/doushi.js", css=f"{N}/ports/doushi.css", plain="動詞の練習", title=R("動詞[どうし]の 練習[れんしゅう]"), glyph="見る",
   lead=R("文[ぶん]に 合[あ]う 動[うご]きの ことばを えらぶ 練習[れんしゅう]です。反対[はんたい]の ことばは 2問[もん] つづけて 出[で]ます。こたえは 1回[かい]で きまります。"),
   fill={"/*@@DOUSHI_DATA@@*/": dou_data}),
}
for k, m in APPS.items():
    js = rd(m["js"])
    for a, b in m.get("fill", {}).items():
        assert js.count(a) == 1; js = js.replace(a, b)
    css = "\n".join(rd(c) for c in m["css"]) if isinstance(m["css"], list) else (rd(m["css"]) if m["css"] else "")
    glyph = m["glyph"]
    if not glyph.startswith("<") and len(glyph) >= 2: glyph_html = glyph; two = True
    else: glyph_html = glyph; two = False
    h = shell
    for a, b in [("@@TITLE_PLAIN@@", m["plain"]), ("@@COMMON_CSS@@", common_css), ("@@APP_CSS@@", css + ("\n.t-leaf{font-size:24px}" if two else "")),
                 ("@@GLYPH@@", glyph_html), ("@@TITLE_RUBY@@", m["title"]), ("@@LEAD@@", m["lead"]), ("@@APP_JS@@", js), ("@@COMMON_JS@@", common_js)]:
        assert h.count(a) == 1, (k, a); h = h.replace(a, b)
    open(f"{OUT}/{k}.html", "w", encoding="utf-8").write(h)
    print(k, len(h.encode()))

# 風船ことば・説明ことば：色と文字だけそろえる＋成績をメニューへ渡す
HOOK = {
 "fusen": """  /* グリーン・グリーン：成績をメニューへ渡す（個人用リンクのときは自動で送られる） */
  try { const pr = PRESETS.find(p => p.band === band && p.n === n); window.parent.postMessage({ gg:'result', typeName:'', levelName:(pr ? pr.name + '（' : '（') + setLabel(band, n) + '）', score: ok.length, max: SET_SIZE,
    marks: G.res.map(r => r.result === 'ok' ? '〇' : '×').join(''),
    items: G.res.map(r => ((r.it && r.it.target && r.it.target.text) || '') + (r.result === 'ok' ? '〇（' + Math.round(r.rt * 10) / 10 + '秒）' : r.result === 'late' ? '×（時間切れ）' : '×（' + Math.round(r.rt * 10) / 10 + '秒・えらんだ：' + ((r.chosen && (r.chosen.text || r.chosen.word)) || '') + '）')),
    sec: Math.round((Date.now() - G.startedAt) / 1000) }, '*'); } catch (e) {}
""",
 "setsumei": """  /* グリーン・グリーン：成績をメニューへ渡す（個人用リンクのときは自動で送られる） */
  try { const pr = PRESETS.find(p => p.band === cfg.band && p.n === cfg.n); window.parent.postMessage({ gg:'result', typeName: G.retry ? 'まちがえた問題の復習' : '', levelName:(pr ? pr.name + '（' : '（') + setLabel(cfg.band, cfg.n) + '）', score: s.ok, max: s.total,
    marks: G.res.map(r => r.result === 'ok' ? '〇' : '×').join(''),
    items: G.res.map(r => ((r.it && r.it.target && (r.it.target.text || r.it.target.word)) || '') + (r.result === 'ok' ? '〇' : '×') + '（' + (typeof r.rt === 'number' ? Math.round(r.rt * 10) / 10 + '秒' : '') + (r.result !== 'ok' && r.chosen ? '・えらんだ：' + (r.chosen.text || r.chosen.word || '') : '') + '）'),
    sec: Math.round((Date.now() - G.startedAt) / 1000) }, '*'); } catch (e) {}
""",
}
theme = rd(f"{N}/ports/theme-blue-apps.css")
for k in ["fusen", "setsumei"]:
    h = rd(f"{SRC}/{k}.html")
    h = re.sub(r"<html(?=[\s>])", '<html data-theme="light"', h, count=1, flags=re.I)
    assert h.count("</body>") == 1
    h = h.replace("</body>", f'<style id="gg-theme">\n{theme}</style>\n</body>')
    for old in ["KEY_HIST = 'fk.history.v1'", "KEY_HIST = 'sk.history.v1'"]:
        if old in h: h = h.replace(old, old + " + (typeof window.GG_USER === 'string' && window.GG_USER ? '.' + window.GG_USER : '')")   # 人ごとに記録を分ける
    assert "window.GG_USER ? '.'" in h, k
    hook_at = "  store.set(KEY_HIST, hist.slice(-50));\n"
    assert h.count(hook_at) == 1, k
    h = h.replace(hook_at, hook_at + HOOK[k])
    open(f"{OUT}/{k}.html", "w", encoding="utf-8").write(h)
    print(k, len(h.encode()))
exec(open(f"{ROOT}/scripts/build_extra.py", encoding="utf-8").read())

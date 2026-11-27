# build_apps.py の続き：風船ことばの大きな〇×・カウントダウン、個人別メニューのすぐ始める、
# 五十音れんしゅう（録音）、挨拶語トレーニング
import re
N = f"{ROOT}/newapps"; SRC = f"{ROOT}/src"; OUT = f"{ROOT}/src/gg"
def rd(p): return open(p, encoding="utf-8").read()
def wr(p, s): open(p, "w", encoding="utf-8").write(s)
common_css = rd(f"{N}/common.css")
rec_js = rd(f"{N}/rec.js")

def sub1(h, a, b, tag):
    assert h.count(a) == 1, (tag, a[:80], h.count(a))
    return h.replace(a, b)

# ---------- 個人別メニュー：職員が決めた難しさで、えらぶ画面を通らずに始める ----------
FIXED = r"""<style>.gg-fixed #openSettings,.gg-fixed #levels .level[aria-pressed="false"]{display:none!important}</style>
<script>
/* グリーン・グリーン：個人別メニューで決めた難しさで、すぐに始める（結果の「設定を変える」は「メニューへ もどる」に） */
(function () {
  var F = window.GG_FIX; if (!F || !F.lv) return;
  var b = document.getElementById('lv-' + F.lv), s = document.getElementById('startBtn'); if (!b || !s) return;
  document.documentElement.classList.add('gg-fixed');
  b.click();
  /* 職員が決めた選択肢の数（2・3・4・6択） */
  var r = F.opts ? document.getElementById('nopt-' + Math.floor(Number(F.opts))) : null;
  if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
  var back = document.getElementById('backBtn');
  if (back) {
    back.textContent = 'メニューへ もどる';
    back.addEventListener('click', function (e) { e.preventDefault(); e.stopImmediatePropagation(); try { parent.postMessage({ gg: 'menu' }, '*'); } catch (x) {} }, true);
  }
  setTimeout(function () { s.click(); }, 80);
})();
</script>
"""

# ---------- 風船ことば：〇×を画面いっぱいに大きく、のこり5秒からは「5・4・3・2・1」を大きく ----------
BIG_CSS = r"""
/* ===== グリーン・グリーン：〇×とカウントダウンを大きく ===== */
.gg-big{position:fixed;inset:0;display:grid;place-items:center;align-content:center;pointer-events:none;z-index:30;opacity:0}
.gg-big span{font-family:"BIZ UDPGothic",var(--font-body);font-weight:700;line-height:1;font-size:min(72vw,60vh,440px);text-shadow:0 0 22px #fff,0 0 6px #fff}
.gg-big small{font-family:var(--font-display);font-weight:900;font-size:clamp(30px,8vw,56px);line-height:1.3;color:#2f6fb3;background:rgba(255,255,255,.92);border-radius:999px;padding:0 .7em;margin-top:-.2em}
.gg-big.ok span{color:rgba(214,58,58,.9)}
.gg-big.ng span,.gg-big.late span{color:rgba(47,111,179,.88)}
.gg-big.show{animation:ggBig 1.6s ease forwards}
@keyframes ggBig{0%{opacity:0;transform:scale(.4)}12%{opacity:1;transform:scale(1.08)}22%{transform:scale(1)}78%{opacity:1}100%{opacity:0}}
.stagewrap{container-type:size}
.gg-cd{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none;z-index:2}
.gg-cd span{font-family:var(--font-display);font-weight:900;line-height:1;font-size:min(34vh,40vw,240px);color:#1d2d25;
  text-shadow:4px 4px 0 #fff,-4px 4px 0 #fff,4px -4px 0 #fff,-4px -4px 0 #fff,0 6px 0 #fff,0 -6px 0 #fff,6px 0 0 #fff,-6px 0 0 #fff,0 10px 18px rgba(0,0,0,.25)}
@supports (font-size:1cqh){.gg-cd span{font-size:min(82cqh,70cqw)}}
.gg-cd.hot span{color:#c0392b}
.gg-cd.tick span{animation:ggTick .9s ease-out}
@keyframes ggTick{0%{transform:scale(1.45);opacity:.25}35%{transform:scale(1);opacity:1}100%{transform:scale(.96)}}
@keyframes ggFade{0%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.gg-big.show{animation:ggFade 1.6s steps(1,end) forwards}.gg-cd.tick span{animation:none}}
"""
BIG_JS = r"""/* グリーン・グリーン：〇×とカウントダウンを大きく出す */
const ggBigEl = document.getElementById('ggBig'), ggCdEl = document.getElementById('ggCd');
function ggBig(kind) {
  ggBigEl.className = 'gg-big';
  if (!kind) { ggBigEl.innerHTML = ''; return; }
  ggBigEl.innerHTML = '<span>' + (kind === 'ok' ? '〇' : '×') + '</span>' + (kind === 'late' ? '<small>時間切れ</small>' : '');
  void ggBigEl.offsetWidth; ggBigEl.classList.add(kind, 'show');
}
let ggCdN = 0;
function ggCd(n) {
  if (!(n >= 1 && n <= 5)) n = 0;
  if (n === ggCdN) return;
  ggCdN = n; ggCdEl.hidden = !n;
  if (!n) return;
  ggCdEl.firstElementChild.textContent = String(n);
  ggCdEl.classList.toggle('hot', n <= 3);
  ggCdEl.classList.remove('tick'); void ggCdEl.offsetWidth; ggCdEl.classList.add('tick');
}
"""
FUSEN = [
  ('<div class="stagewrap" id="stagewrap"><canvas id="stage" aria-hidden="true"></canvas></div>',
   '<div class="stagewrap" id="stagewrap"><canvas id="stage" aria-hidden="true"></canvas><div class="gg-cd" id="ggCd" hidden aria-hidden="true"><span></span></div></div>'),
  ('<div class="scrim" id="pauseScrim" hidden>', '<div class="gg-big" id="ggBig" aria-hidden="true"></div>\n  <div class="scrim" id="pauseScrim" hidden>'),
  ('function showQuestion() {', BIG_JS + 'function showQuestion() {'),
  ("  G.phase = 'enter'; G.enterT = 0; G.el = 0; G.auto = -1;\n", "  G.phase = 'enter'; G.enterT = 0; G.el = 0; G.auto = -1; ggBig(''); ggCd(0);\n"),
  ("  G.phase = 'feedback'; Snd.stopHiss(); markChoices(i);\n", "  G.phase = 'feedback'; Snd.stopHiss(); markChoices(i); ggCd(0); ggBig(ok ? 'ok' : 'ng');\n"),
  ("  G.phase = 'feedback'; Snd.stopHiss(); Snd.pop(); stage.pop(); markChoices(-1);\n", "  G.phase = 'feedback'; Snd.stopHiss(); Snd.pop(); stage.pop(); markChoices(-1); ggCd(0); ggBig('late');\n"),
  ("      G.el += dt;\n", "      G.el += dt; ggCd(Math.ceil(TIME_LIMIT - G.el));\n"),
  ("function quit() {\n", "function quit() {\n  ggCd(0); ggBig('');\n"),
]
for k in ["fusen", "setsumei"]:
    h = rd(f"{OUT}/{k}.html")
    assert 'id="gg-theme"' in h and "GG_FIX" not in h, k
    if k == "fusen":
        for a, b in FUSEN: h = sub1(h, a, b, k)
        h = sub1(h, '</style>\n</body>', BIG_CSS + '</style>\n</body>', k)
    h = sub1(h, '</body>', FIXED + '</body>', k)
    # 問題数：職員が人ごとに決めたとき（GG_FIX.n）はその数
    h = sub1(h, 'const SET_SIZE = 10;', 'const SET_SIZE = (function () { var f = window.GG_FIX, n = f && Math.floor(Number(f.n)); return n >= 1 && n <= 30 ? n : 10; })();', k)
    wr(f"{OUT}/{k}.html", h); print(k, "+extra", len(h.encode()))

# ---------- 五十音れんしゅう（録音）：元は Claude のページ専用だったので、端末の中に録音を残す形で作り直したもの ----------
h = rd(f"{N}/standalone/gojuonrec.html")
for a, b in [("@@COMMON_CSS@@", common_css), ("@@REC@@", rec_js)]: h = sub1(h, a, b, "gojuonrec")
wr(f"{OUT}/gojuonrec.html", h); print("gojuonrec", len(h.encode()))

# ---------- 挨拶語トレーニング：元のアプリのまま、色と文字をそろえる＋練習した回数をメニューへ渡す ----------
h = rd(f"{SRC}/aisatsu.html")
FONTS = '<link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Zen+Maru+Gothic:wght@500;700;900&display=swap" rel="stylesheet">'
AIS = [
  # グリーン・グリーン：職員が決めた場面（宿題のお題）だけを出す
  ("    STAGES.forEach(stage => {\n", "    ggStages().forEach(stage => {\n"),
  ("    const randomIndex = Math.floor(Math.random() * STAGES.length);\n    const randomStage = STAGES[randomIndex];",
   "    const ggS = ggStages(), randomIndex = Math.floor(Math.random() * ggS.length);\n    const randomStage = ggS[randomIndex];"),
  ("  // --- アプリケーションの状態変数 ---\n", "  // --- アプリケーションの状態変数 ---\n  const ggStages = () => { const f = window.GG_FIX, t = f && Array.isArray(f.topics) ? f.topics.map(String) : []; const s = STAGES.filter(x => t.indexOf(x.id) >= 0); return s.length ? s : STAGES; };\n"),
  ("""  <script src="audio_data.js" onerror="console.log('audio_data.js not found, using live TTS.')"></script>\n""", ""),
  ('<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700;900&family=Zen+Maru+Gothic:wght@500;700;900&family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">', FONTS),
  # 元の絵のうち hana_e1（ご飯の場面）は生成に失敗した絵（黒板に英語の文字）なので使わず、描いた絵（SVG）にもどす
  ("const SCENE_IMG_ALL = ['m1','m2','n1','n2','y1','y2','g1','g2','e1','e2','e3','e4',", "const SCENE_IMG_ALL = ['m1','m2','n1','n2','y1','y2','g1','g2','e2','e3','e4',"),
  ("  // --- アプリケーションの状態変数 ---\n", "  // --- アプリケーションの状態変数 ---\n  let ggT0 = Date.now(), ggDone = [], ggRecT0 = 0;   // グリーン・グリーン：成績・録音用\n"),
  ("      mediaRecorder.start();\n", "      mediaRecorder.start(); ggRecT0 = Date.now();\n"),
  ("        audioBlob = new Blob(audioChunks, options);\n", """        audioBlob = new Blob(audioChunks, options);
        /* グリーン・グリーン：録った声をメニューに渡す（職員へ送るかは、メニューが「声も送る」の設定で決める） */
        try { if (audioBlob.size) { const st = currentStageSteps[currentStepIndex];
          window.parent.postMessage({ gg: 'audio', blob: audioBlob, mime: (audioBlob.type || 'audio/webm').split(';')[0], dur: ggRecT0 ? (Date.now() - ggRecT0) / 1000 : 0,
            label: (currentStage ? currentStage.title + '・' : '') + (st ? st.targetWord : '') }, '*'); } } catch (e) {}
"""),
  ("    currentStepIndex = 0;\n    setupStepInterface();", "    currentStepIndex = 0;\n    ggT0 = Date.now(); ggDone = [];\n    setupStepInterface();"),
  ("  function onSpeechFinish() {\n", "  function onSpeechFinish() {\n    try { const w = currentStageSteps[currentStepIndex].targetWord; if (ggDone.indexOf(w) < 0) ggDone.push(w); } catch (e) {}\n"),
  ("      // 終了：ステージ選択画面へ戻る\n", """      // 終了：ステージ選択画面へ戻る
      /* グリーン・グリーン：練習した回数をメニューへ渡す（個人用リンクのときは職員に送られる。声は送らない） */
      try { if (ggDone.length) window.parent.postMessage({ gg: 'result', typeName: currentStage.title, levelName: '録音', score: ggDone.length, max: 0, marks: '', items: ggDone.slice(), sec: Math.round((Date.now() - ggT0) / 1000) }, '*'); } catch (e) {}
"""),
]
for a, b in AIS: h = sub1(h, a, b, "aisatsu")
h = re.sub(r"<html(?=[\s>])", '<html data-theme="light"', h, count=1, flags=re.I)
h = sub1(h, "</body>", '<style id="gg-theme">\n' + rd(f"{N}/ports/theme-aisatsu.css") + '</style>\n</body>', "aisatsu")
wr(f"{OUT}/aisatsu.html", h); print("aisatsu", len(h.encode()))

# ---------- 語想起タイムアタック（60秒・録音・カテゴリ／語頭音） ----------
h = rd(f"{N}/standalone/goso.html")
for a, b in [("@@COMMON_CSS@@", common_css), ("@@REC@@", rec_js)]: h = sub1(h, a, b, "goso")
wr(f"{OUT}/goso.html", h); print("goso", len(h.encode()))

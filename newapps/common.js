/* ===== 共通のしくみ（難しさ → 10問 → 結果）=====
   回答は2回まで：1回目で正解=〇(1点)、2回目で正解=△(0.5点)、2回まちがえる=×(0点)で正答を青で示す。
   各練習は APP（このファイルの前に定義）で、問題の作り方と画面を決める。 */
const $ = id => document.getElementById(id);
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sample = (a, n) => shuffle(a).slice(0, Math.max(0, n));
const randInt = n => Math.floor(Math.random() * n);
/* 「漢字[かな]」の書き方をふりがな付きにする／ふりがなを外す */
const R = s => String(s).replace(/([一-鿿々〆ヶ]+)\[([ぁ-ゖー]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
const P = s => String(s).replace(/\[[ぁ-ゖー]+\]/g, '');
const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
/* 職員が人ごとに決めた 問題数・選択肢の数・お題（個人別メニューの GG_FIX。決めていないときは難しさで決まる数） */
const PER = (() => {
  const f = window.GG_FIX && typeof window.GG_FIX === 'object' ? window.GG_FIX : {};
  const n = Math.floor(Number(f.n)), o = f.opts === '' || f.opts == null ? NaN : Math.floor(Number(f.opts));
  return { n: n >= 1 && n <= 30 ? n : 0, opts: o >= 0 && o <= 12 ? o : null,
    topics: Array.isArray(f.topics) ? f.topics.map(t => String(t)).filter(Boolean) : [] };
})();
const SET_SIZE = PER.n || 10;
/* 選択肢の数：決められていれば min〜max の中で使う（その練習で作れる数まで） */
const optN = (def, min, max) => PER.opts == null ? def : Math.max(min, Math.min(max, PER.opts));
/* お題：決められていれば、その中から出す（keyOf でお題の名前を取り出す）。合うものがなければ null */
function topicPool(pool, keyOf) {
  if (!PER.topics.length) return null;
  const want = new Set(PER.topics);
  const got = pool.filter(x => want.has(keyOf(x)));
  return got.length ? got : null;
}
/* 少ないお題で問題数をうめるときは、まぜながら くり返す */
function fillTo(list, n) { let out = []; while (out.length < n && list.length) out = out.concat(shuffle(list)); return out.slice(0, n); }
const LEVELS = [
  { key:'easy',   name:'簡単[かんたん]', stars:1 },
  { key:'normal', name:'普通[ふつう]',   stars:2 },
  { key:'hard',   name:'難[むずか]しい', stars:3 },
];
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const GO_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

let S = null, locked = false;
let curType = APP.types ? store.get(APP.id + '.type', APP.types[0].key) : null;
if (APP.types && !APP.types.some(t => t.key === curType)) curType = APP.types[0].key;
/* まちがえてよい回数（ふつうは2回目まで。APP.maxMiss で1回だけにもできる） */
const maxMiss = () => APP.maxMiss ? APP.maxMiss(S.qs[S.i], S.lv) : 2;
/* 施設のタブレットでは、練習している人ごとに さいこう点を分ける（メニューが GG_USER を知らせる） */
const WHO = (typeof window.GG_USER === 'string' && /^[A-Za-z0-9_-]{1,20}$/.test(window.GG_USER)) ? window.GG_USER : '';
/* 個人別メニュー：職員が決めた「難しさ・しゅるい」で開かれたときは、えらぶ画面を出さずに始める */
const FIX = (() => {
  const f = window.GG_FIX;
  if (!f || typeof f !== 'object' || !LEVELS.some(l => l.key === f.lv)) return null;
  const type = APP.types && APP.types.some(t => t.key === f.type) ? f.type : null;
  return { lv: f.lv, type };
})();
if (FIX && FIX.type) curType = FIX.type;
const toMenu = () => { try { if (window.parent && window.parent !== window) { window.parent.postMessage({ gg: 'menu' }, '*'); return true; } } catch (e) {} return false; };
const bestKey = (lv, type) => APP.id + (WHO ? '.' + WHO : '') + '.best.' + (type ? type + '.' : '') + lv;

function show(id) {
  for (const s of ['title', 'quiz', 'result']) $(s).hidden = s !== id;
  window.scrollTo(0, 0);
}

function renderTitle() {
  if (APP.types) {
    $('typeBox').hidden = false;
    $('typeLabel').innerHTML = '① ' + R(APP.typeLabel || 'しゅるいを えらぶ');
    $('lvLabel').innerHTML = '② ' + R('難[むずか]しさを えらぶと はじまります');
    $('types').innerHTML = APP.types.map(t =>
      `<button class="type" type="button" data-type="${t.key}" aria-pressed="${t.key === curType}">${R(t.name)}</button>`).join('');
  } else {
    $('lvLabel').innerHTML = R('難[むずか]しさを えらぶと はじまります');
  }
  $('levels').innerHTML = LEVELS.map(l => {
    const best = store.get(bestKey(l.key, curType), null);
    return `<button class="level" type="button" data-lv="${l.key}">
      <span class="lv-name">${R(l.name)}</span>
      <span class="lv-info">
        <span class="lv-stars">${'★'.repeat(l.stars)}<span>${'★'.repeat(3 - l.stars)}</span></span>
        <span class="lv-desc">${R(APP.levelDesc(l.key, curType))}</span>
        ${best != null ? `<span class="lv-best">これまでの さいこう　${fmt(best)}点</span>` : ''}
      </span>
      <span class="lv-go" aria-hidden="true">${GO_SVG}</span>
    </button>`;
  }).join('');
}

function start(lv) {
  S = { lv, type: curType, qs: APP.make(lv, curType), i: 0, res: [], t0: Date.now() };
  document.querySelectorAll('.setn').forEach(e => { e.textContent = S.qs.length; });
  show('quiz');
  renderQ();
}

function renderQ() {
  const q = S.qs[S.i];
  S.errs = 0; locked = false;
  $('qno').textContent = (S.i + 1) + ' / ' + S.qs.length;
  $('bar').style.width = (S.i / S.qs.length * 100) + '%';
  fb('', '');
  $('next').hidden = true;
  $('instr').innerHTML = R(APP.instr(q, S.lv));
  $('stage').innerHTML = ''; $('stage').className = 'stage';
  const ch = $('choices'); ch.innerHTML = ''; ch.className = 'choices'; ch.removeAttribute('style'); ch.removeAttribute('data-n');
  S.qt0 = Date.now(); S.wrong = [];
  APP.render(q, S.lv, API);
  window.scrollTo(0, 0);
}
/* まちがえて選んだものの名前（職員が「問題ごと」で見る） */
function optLabel(btn) {
  if (!btn) return '';
  try { if (APP.optLabel) { const v = APP.optLabel(btn._v, S.qs[S.i], btn); if (v) return String(v).slice(0, 20); } } catch (e) {}
  const c = btn.cloneNode(true); c.querySelectorAll('rt,rp').forEach(n => n.remove());
  const t = c.textContent.replace(/\s+/g, ' ').trim();
  if (t) return t.slice(0, 20);
  if (typeof btn._v === 'string' || typeof btn._v === 'number') return P(String(btn._v)).slice(0, 20);
  return (btn.getAttribute('aria-label') || '').slice(0, 20);
}

const API = {
  /* まちがい：1回目は「もう一度」、2回目で正答を示して終わり */
  miss(btn, label) {
    if (locked) return;
    S.errs++;
    try { const l = label || optLabel(btn); if (l) S.wrong.push(l); } catch (e) {}
    if (btn) { btn.classList.add('ng'); btn.disabled = true; }
    if (S.errs >= maxMiss()) {
      locked = true;
      try { APP.reveal(S.qs[S.i], S.lv); } catch (e) {}
      end(0);
    } else {
      mark('ng');
      fb('ng', R('もう一度[いちど] どうぞ'));
    }
  },
  /* 問題を最後まで正しく答えた */
  solve() { if (locked) return; locked = true; end(S.errs ? 0.5 : 1); },
  /* 点数を直接つけて終わる（1＝〇、0.5＝△、0＝×） */
  score(pt) { if (locked) return; locked = true; end(pt); },
  /* 途中の声かけ（例：あと 2つ） */
  note(html) { if (!locked) fb('', html); },
  get locked() { return locked; },
};

function fb(cls, html) { const f = $('fb'); f.className = 'fb' + (cls ? ' ' + cls : ''); f.innerHTML = html; }
function mark(kind) {
  const m = $('mark');
  m.className = 'mark ' + kind;
  m.firstElementChild.textContent = kind === 'ok' ? '〇' : kind === 'tri' ? '△' : '×';
  void m.offsetWidth;
  m.classList.add('show');
}
function end(pt) {
  S.res.push(pt);
  (S.det = S.det || [])[S.i] = { sec: Math.round((Date.now() - (S.qt0 || Date.now())) / 100) / 10, wrong: (S.wrong || []).slice() };
  document.querySelectorAll('#choices button, #stage button').forEach(b => { b.disabled = true; });
  const custom = APP.fbText ? APP.fbText(S.qs[S.i], pt) : null;
  if (custom) { mark(pt === 1 ? 'ok' : pt === 0.5 ? 'tri' : 'ng'); fb(pt === 1 ? 'ok' : pt === 0.5 ? 'tri' : 'ng', R(custom)); }
  else if (pt === 1) { mark('ok'); fb('ok', '〇 せいかい！'); }
  else if (pt === 0.5) { mark('tri'); fb('tri', '△ せいかい！（2回目）'); }
  else { mark('ng'); fb('ng', '× ' + R(APP.answerText(S.qs[S.i], S.lv))); }
  $('bar').style.width = ((S.i + 1) / S.qs.length * 100) + '%';
  const last = S.i >= S.qs.length - 1;
  $('next').innerHTML = last ? R('結果[けっか]を みる') : R('つぎの 問題[もんだい]へ');
  $('next').hidden = false;
  try { $('next').focus({ preventScroll: true }); $('next').scrollIntoView({ block: 'nearest' }); } catch (e) {}
  if (APP.onEnd) { try { APP.onEnd(S.qs[S.i], pt, S.lv); } catch (e) {} }
}

function finish() {
  const n = S.qs.length, score = S.res.reduce((a, b) => a + b, 0);
  const k = bestKey(S.lv, S.type), prev = store.get(k, null);
  if (prev == null || score > prev) store.set(k, score);
  const lvName = LEVELS.find(l => l.key === S.lv).name;
  const tName = APP.types ? APP.types.find(t => t.key === S.type).name + '・' : '';
  $('rMeta').innerHTML = R(tName + lvName);
  $('rStamp').textContent = score >= n * 0.9 ? '💮' : score >= n * 0.6 ? '🌸' : '🌱';
  $('rScore').innerHTML = `${n}点満点中 <b>${fmt(score)}</b> 点`;
  $('rMarks').innerHTML = S.res.map(r => r === 1 ? '<span class="o">〇</span>' : r === 0.5 ? '<span class="t">△</span>' : '<span class="x">×</span>').join('');
  report(score, n);
  if (APP.legend) $('rLegend').innerHTML = R(APP.legend);
  if (APP.onFinish) { try { APP.onFinish(); } catch (e) {} }
  $('rPraise').textContent = score >= n * 0.9 ? 'たいへん よく できました！' : score >= n * 0.6 ? 'よく がんばりました！' : 'ゆっくりで だいじょうぶです。';
  show('result');
}

/* 成績をメニュー（ことばの練習アプリ）へ渡す。個人用リンクで開いているときは、メニューが自動で送る */
function report(score, n) {
  const mk = r => r === 1 ? '〇' : r === 0.5 ? '△' : '×';
  try {
    const lv = LEVELS.find(l => l.key === S.lv), ty = APP.types ? APP.types.find(t => t.key === S.type) : null;
    window.parent.postMessage({
      gg: 'result', typeName: ty ? P(ty.name) : '', levelName: P(lv.name), score, max: n,
      marks: S.res.map(mk).join(''),
      /* 問題ごと：「ことば〇（3.2秒）」「ほうき×（8.5秒・えらんだ：はし、ほし）」 */
      items: S.qs.map((q, i) => {
        let l = ''; try { l = APP.itemLabel ? APP.itemLabel(q, S) : ''; } catch (e) {}
        const d = S.det && S.det[i];
        const more = d ? '（' + d.sec + '秒' + (d.wrong.length ? '・えらんだ：' + d.wrong.join('、') : '') + '）' : '';
        return String(l || ('問' + (i + 1))).replace(/[／]/g, '/') + mk(S.res[i]) + more;
      }),
      sec: Math.round((Date.now() - S.t0) / 1000),
    }, '*');
  } catch (e) {}
}

/* 1つだけ正解がある選択肢（多くの練習で使う） */
function choiceButtons(opts, html, isRight, onRight) {
  const box = $('choices');
  box.dataset.n = opts.length;
  opts.forEach(o => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'ch'; b.innerHTML = '<span class="ch-in">' + html(o) + '</span>'; b._v = o;
    b.addEventListener('click', () => {
      if (locked || b.disabled) return;
      if (isRight(o)) { b.classList.add('ok'); if (onRight) onRight(o, b); API.solve(); }
      else API.miss(b);
    });
    box.appendChild(b);
  });
}
function revealChoice(isRight) {
  document.querySelectorAll('#choices .ch').forEach(b => { if (isRight(b._v)) b.classList.add('reveal'); });
}

/* ボタン */
$('types').addEventListener('click', e => {
  const b = e.target.closest('.type'); if (!b) return;
  curType = b.dataset.type; store.set(APP.id + '.type', curType); renderTitle();
  const nb = document.querySelector('.type[data-type="' + curType + '"]'); if (nb) nb.focus();
});
$('levels').addEventListener('click', e => { const b = e.target.closest('.level'); if (b) start(b.dataset.lv); });
$('next').addEventListener('click', () => { S.i++; if (S.i >= S.qs.length) finish(); else renderQ(); });
$('again').addEventListener('click', () => start(S.lv));
$('home').addEventListener('click', () => { if (FIX && toMenu()) return; renderTitle(); show('title'); });
$('quit').addEventListener('click', () => { $('quitScrim').hidden = false; $('stay').focus(); });
$('stay').addEventListener('click', () => { $('quitScrim').hidden = true; });
$('leave').addEventListener('click', () => { $('quitScrim').hidden = true; S = null; if (APP.onQuit) { try { APP.onQuit(); } catch (e) {} } if (FIX && toMenu()) return; renderTitle(); show('title'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('quitScrim').hidden) $('quitScrim').hidden = true; });

if (FIX) {
  /* 決められた練習：結果の画面のボタンを「メニューへ もどる」にして、すぐに始める */
  document.documentElement.classList.add('gg-fixed');
  $('home').innerHTML = 'メニューへ もどる';
  renderTitle(); start(FIX.lv);
} else renderTitle();

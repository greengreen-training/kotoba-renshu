/* 文を つくろう（いつ・どこで・なにを）：話題の質問に、声で答えて録音する。文の組み立て（いつ・どこで・なにを した）の練習。
   簡単：「なにを した」だけ（〇〇を しました）。
   普通：まず「なにを した」→ 追加の質問「いつ？」→「どこで？」に1つずつ答え、最後に全部つなげて長い文で言う。
   難しい：質問の手助けなしに「わたしは いつ どこで なにを しました」を1つの長い文で言う。
   答えは人によってちがうので、正しいかどうかはアプリでは決めない。言えたかを「言えた／少し言えた／言えなかった」でつける。
   録音はこの端末の中で聞き返す。職員が「声も送る」にした人だけ、声をメニューに渡す（メニューが職員へ送る）。 */
/*@@REC@@*/

/*@@BUN_TOPICS@@*/
const ONE_NOTE = '「いつ・どこで・なにを」を 入[い]れて、1つの 文[ぶん]で 話[はな]しましょう';
const SLOT = { what:'なにを した', when:'いつ', where:'どこで', all:'つなげて' };
const BUN = {
  easy:   { n:5, steps:['what'] },
  normal: { n:3, steps:['what', 'when', 'where', 'all'] },
  hard:   { n:5, steps:['one'] },
};

function speakJa(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
/* 録った声はいつもメニューに渡す。職員へ送るかどうかは、メニューが「声も送る」の設定を確かめて決める */
function sendVoice(t, label) { if (!t || !t.blob) return; try { window.parent.postMessage({ gg: 'audio', blob: t.blob, mime: t.mime, dur: t.dur, label }, '*'); } catch (e) {} }
let takes = [];       // この問題で録った声（ステップごとに最後の1つ）
let player = null;
function stopPlay() { if (player) { try { player.pause(); } catch (e) {} player = null; } }
function stopAll() { stopPlay(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }
function dropTakes() { takes.forEach(t => { try { URL.revokeObjectURL(t.url); } catch (e) {} }); takes = []; }
function playUrl(url) { stopAll(); player = new Audio(url); player.play().catch(() => {}); }

/* 「わたしは／いつ／どこで／なにを した」の枠 */
function frameHTML(lv, cur, done, give) {
  const show = lv === 'easy' ? ['what'] : ['when', 'where', 'what'];
  const cell = k => {
    const on = cur === k || cur === 'one' || cur === 'all', ok = done.includes(k);
    const g = give && give[k] ? `<small>${R(give[k])}</small>` : '';
    return `<span class="slot s-${k}${on ? ' on' : ''}${ok ? ' done' : ''}"><b>${R(SLOT[k])}</b>${g}${ok ? '<i aria-label="言えた">✓</i>' : ''}</span>`;
  };
  return `<div class="frame" aria-label="文の形"><span class="slot s-me"><b>わたしは</b></span>${show.map(cell).join('<span class="arrow" aria-hidden="true">›</span>')}</div>`;
}

const APP = {
  noReview: true,   // 声で こたえる練習なので、まちがえた問題の復習は 付けない
  id:'gg.bun',
  levelDesc(lv) { return { easy:'「〇〇を しました」と 言[い]う・5問[もん]', normal:'「いつ？」「どこで？」の 質問[しつもん]に こたえて、つなげて 長[なが]い 文[ぶん]に・3問[もん]', hard:'質問[しつもん]なしで「いつ・どこで・なにを」を 1つの 長[なが]い 文[ぶん]で・5問[もん]' }[lv]; },
  typeLabel:'問題[もんだい]の しゅるいを えらぶ',
  types:[ { key:'place', name:'場所[ばしょ]から（家[いえ]で・外[そと]で など）' }, { key:'time', name:'時間[じかん]から（朝[あさ]・夜[よる] など）' },
          { key:'thing', name:'人[ひと]・ことから（家族[かぞく]と・食[た]べた もの など）' }, { key:'mix', name:'まぜる' } ],
  make(lv, type) {
    const pool = topicPool(TOPICS, t => P(t.k)) || TOPICS.filter(t => type === 'mix' || !type || t.t === type);
    return sample(pool, PER.n || BUN[lv].n).map(t => Object.assign({}, t));
  },
  instr(q, lv) { return lv === 'normal' ? '質問[しつもん]に 声[こえ]で こたえて、さいごに 長[なが]い 文[ぶん]に しましょう' : '質問[しつもん]に 声[こえ]で こたえましょう'; },
  render(q, lv, api) {
    stopAll(); dropTakes();
    const steps = BUN[lv].steps, done = [];
    let si = 0;
    const box = $('choices');
    box.className = 'choices say';
    const stepQ = st => st === 'when' ? q.when : st === 'where' ? q.where
      : st === 'all' ? 'では、ぜんぶ つなげて 言[い]って みましょう'
      : q.q;
    const stepHint = st => {
      if (st === 'when') return q.ex.when;
      if (st === 'where') return q.ex.where;
      if (st === 'what') return q.ex.what;
      return [q.full];
    };
    function draw() {
      const st = steps[si], last = si === steps.length - 1;
      const qText = stepQ(st);
      $('stage').innerHTML = `${frameHTML(lv, st, done, q.give)}
        <div class="q-card">
          ${steps.length > 1 ? `<span class="q-step">${si + 1} / ${steps.length}　${R(st === 'all' ? 'つなげて 言[い]う' : st === 'what' ? 'なにを した？' : SLOT[st] + '？')}</span>` : ''}
          <p class="q-text">${R(qText)}</p>
          ${st === 'one' ? `<p class="q-sub">${R(ONE_NOTE)}</p>` : ''}
          <button class="speak" id="speakBtn" type="button"><span class="emo" aria-hidden="true">🔊</span> <ruby>聞<rt>き</rt></ruby>く</button>
        </div>
        ${st === 'all' ? `<div class="recap">${['when', 'where', 'what'].map(k => { const t = takes.find(x => x.st === k);
            return `<button class="recap-b s-${k}" type="button" data-take="${k}" ${t ? '' : 'disabled'}><b>${R(SLOT[k])}</b>${t ? '▶' : '−'}</button>`; }).join('')}</div>
          <p class="recap-n">${R('さっき 言[い]った ことを 聞[き]いて、つなげて みましょう')}</p>` : ''}
        <div class="hint" id="hint" hidden></div>`;
      box.innerHTML = `
        ${REC.can ? `<div class="say-row">
          <button class="rec-btn" id="recBtn" type="button"><span class="ic" aria-hidden="true">●</span><span class="lb" id="recLb">${R('録音[ろくおん]する')}</span></button>
          <button class="play-btn" id="playBtn" type="button" hidden><span class="ic" aria-hidden="true">▶</span><span class="lb">${R('自分[じぶん]の 声[こえ]を 聞[き]く')}</span></button>
        </div>
        <p class="rec-state" id="recState" aria-live="polite">${R('押[お]してから 言[い]って、言[い]い おわったら もう一度[いちど] 押[お]します')}</p>`
        : `<p class="rec-state">${R('声[こえ]に 出[だ]して 言[い]って みましょう（この 端末[たんまつ]では 録音[ろくおん]できません）')}</p>`}
        <div class="say-row cue">
          <button class="cue-btn" id="hintBtn" type="button"><span class="emo" aria-hidden="true">💡</span><span class="lb">${R('ヒント（例[れい]）')}</span></button>
          ${last ? '' : `<button class="next-step" id="stepBtn" type="button"><span class="lb">${R('つぎの 質問[しつもん]へ')}</span><span aria-hidden="true">→</span></button>`}
        </div>
        ${last ? `<div class="judge" id="judge">
          <p class="j-q">${R('言[い]えましたか？')}</p>
          <div class="say-row">
            <button class="j-btn ok" id="jOk" type="button"><b>〇</b><span class="lb">${R('言[い]えた')}</span></button>
            <button class="j-btn tri" id="jTri" type="button"><b>△</b><span class="lb">${R('少[すこ]し 言[い]えた')}</span></button>
            <button class="j-btn ng" id="jNg" type="button"><b>×</b><span class="lb">${R('言[い]えなかった')}</span></button>
          </div></div>` : ''}`;
      $('speakBtn').addEventListener('click', () => { if (!REC.busy()) { stopPlay(); speakJa(P(qText) + (st === 'one' ? '。' + P(ONE_NOTE) : '')); } });
      $('stage').querySelectorAll('[data-take]').forEach(b => b.addEventListener('click', () => { const t = takes.find(x => x.st === b.dataset.take); if (t && !REC.busy()) playUrl(t.url); }));
      $('hintBtn').addEventListener('click', () => {
        const h = $('hint');
        h.innerHTML = `<span class="h-ttl">${R('例[れい]えば')}</span>` + stepHint(st).map(x => `<span class="h-chip">${R(x)}</span>`).join('');
        h.hidden = false; $('hintBtn').disabled = true;
      });
      if (REC.can) {
        const recBtn = $('recBtn'), playBtn = $('playBtn'), stt = $('recState');
        const mine = () => takes.find(x => x.st === st);
        const idle = () => { recBtn.classList.remove('on'); $('recLb').innerHTML = mine() ? R('録[と]り直[なお]す') : R('録音[ろくおん]する'); document.body.dataset.rec = ''; };
        if (mine()) { playBtn.hidden = false; idle(); }
        recBtn.addEventListener('click', async () => {
          if (api.locked) return;
          if (REC.busy()) { REC.stop(); return; }
          stopAll();
          recBtn.classList.add('on'); $('recLb').innerHTML = R('とめる'); document.body.dataset.rec = '1';
          const ok = await REC.start({
            max: st === 'all' || st === 'one' ? 40 : 25,
            onTick: s => { stt.innerHTML = R('録音中[ろくおんちゅう]') + `… <b>${s}</b>` + R('秒[びょう]') + '　' + R('言[い]い おわったら「とめる」'); },
            onDone: t => {
              if (!t) { idle(); stt.innerHTML = R('音[おと]が 録[と]れませんでした。もう一度[いちど] どうぞ'); return; }
              const old = mine(); if (old) { try { URL.revokeObjectURL(old.url); } catch (e) {} takes = takes.filter(x => x !== old); }
              takes.push(Object.assign({ st }, t));
              idle(); playBtn.hidden = false;
              stt.innerHTML = R('録音[ろくおん]しました。「自分[じぶん]の 声[こえ]を 聞[き]く」で 聞[き]けます');
              sendVoice(t, P(q.k) + '・' + (st === 'one' ? 'いつ・どこで・なにを' : st === 'all' ? 'つなげた文' : SLOT[st]) + '（' + (S.i + 1) + '問目）');
            },
            onError: code => { idle(); stt.innerHTML = R(REC_ERR[code] || REC_ERR.unsupported); },
          });
          if (!ok) idle();
        });
        playBtn.addEventListener('click', () => { const t = mine(); if (t && !REC.busy()) playUrl(t.url); });
      }
      if (!last) $('stepBtn').addEventListener('click', () => {
        if (REC.busy()) REC.stop();
        if (!done.includes(st)) done.push(st);
        si++; stopAll(); draw();
        setTimeout(() => speakJa(P(stepQ(steps[si]))), 250);
        try { window.scrollTo(0, 0); } catch (e) {}
      });
      else {
        const fin = pt => { if (REC.busy()) REC.stop(); stopAll(); ['what', 'when', 'where'].forEach(k => { if (!done.includes(k) && steps.includes(k)) done.push(k); }); api.score(pt); };
        $('jOk').addEventListener('click', () => fin(1));
        $('jTri').addEventListener('click', () => fin(0.5));
        $('jNg').addEventListener('click', () => fin(0));
      }
    }
    draw();
  },
  fbText(q, pt) { return pt === 1 ? '〇 言[い]えました！' : pt === 0.5 ? '△ 少[すこ]し 言[い]えました' : '× つぎは 言[い]えると いいですね'; },
  onEnd() {
    /* つけたあとも、録った声は聞き返せる */
    const j = $('judge'); if (j) j.hidden = true;
    const r = $('recBtn'); if (r) r.hidden = true;
    const s = $('stepBtn'); if (s) s.hidden = true;
    const h = $('hintBtn'); if (h) h.hidden = true;
    const pb = $('playBtn'); if (pb) pb.disabled = false;
    const st = $('recState'); if (st && REC.can) st.innerHTML = takes.length ? R('録[と]った 声[こえ]を もう一度[いちど] 聞[き]けます') : '';
    if (takes.length > 1) {
      const list = document.createElement('div');
      list.className = 'recap end';
      list.innerHTML = takes.map(t => `<button class="recap-b s-${t.st === 'one' ? 'all' : t.st}" type="button" data-end="${t.st}"><b>${R(t.st === 'one' ? 'いつ・どこで・なにを' : SLOT[t.st])}</b>▶</button>`).join('');
      $('choices').appendChild(list);
      list.querySelectorAll('[data-end]').forEach(b => b.addEventListener('click', () => { const t = takes.find(x => x.st === b.dataset.end); if (t) playUrl(t.url); }));
    }
  },
  reveal() {},
  answerText() { return ''; },
  itemLabel(q) { return P(q.k); },
  legend: '〇 = 言[い]えた（1点[てん]）　△ = 少[すこ]し 言[い]えた（0.5点[てん]）　× = 言[い]えなかった（0点[てん]）',
  onFinish() { stopAll(); REC.release(); dropTakes(); document.body.dataset.rec = ''; },
  onQuit() { stopAll(); REC.release(); dropTakes(); document.body.dataset.rec = ''; },
};
/* はじめの質問は読み上げる（録音とかさならないよう、少し待ってから） */
const _bunRender = APP.render;
APP.render = function (q, lv, api) { _bunRender(q, lv, api); setTimeout(() => { if (!REC.busy()) speakJa(P(q.q) + (lv === 'hard' ? '。' + P(ONE_NOTE) : '')); }, 400); };

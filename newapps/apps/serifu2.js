/* セリフを いいましょう：「セリフを えらびましょう」と同じ場面で、選択肢なしに「あなた」のセリフを声に出して言う。
   録音して自分の声を聞き返し、こたえ（例）とお手本の声とくらべて「言えた／言えなかった」をつける。
   ヒントを見てから言えたときは △（0.5点）。録音は、職員が「声も送る」にした人だけ職員へ送る（それ以外は端末の中だけ）。 */
/*@@SERIFU_DATA@@*/
/*@@REC@@*/

/* ふりがなの読み・はじめの音・はじめのことば（ヒント） */
const yomi = s => String(s).replace(/([一-鿿々〆ヶ]+)\[([ぁ-ゖー]+)\]/g, '$2');
function firstMora(s) { const a = [...yomi(s).replace(/^[「『（\s]+/, '')]; return a[0] + (/[ゃゅょぁぃぅぇぉ]/.test(a[1] || '') ? a[1] : ''); }
function firstPhrase(s) { const m = String(s).match(/^[^ 　、。]+[、。]?/); return m ? m[0] : String(s); }
function firstMorae(s, n) { const a = [...yomi(s).replace(/^[「『（\s]+/, '')], out = []; for (let i = 0; i < a.length && out.length < n; i++) { if (/[ゃゅょぁぃぅぇぉ]/.test(a[i]) && out.length) out[out.length - 1] += a[i]; else if (!/[、。！？\s]/.test(a[i])) out.push(a[i]); } return out.join(''); }
/* 簡単：はじめの ことば（それで ほとんど こたえに なるときは はじめの 2字）／普通：はじめの 1字 */
function hintOf(s, kind) {
  if (kind === 'mora') return firstMora(s);
  const f = firstPhrase(s), len = t => P(t).replace(/[、。！？\s　]/g, '').length;
  return len(f) <= len(s) * 0.6 ? f : firstMorae(s, 2);
}

const SAY = {
  easy:   { modes:['reply'],         hint:'phrase' },
  normal: { modes:['reply', 'self'], hint:'mora' },
  hard:   { modes:['reply', 'self'], hint:null },
};
/* 職員が「声も送る」にした人は、録った声をメニューに渡す（メニューが職員へ送る）。それ以外の人の声は端末の外に出さない */
/* 録った声はいつもメニューに渡す。職員へ送るかどうかは、メニューが「声も送る」の設定を確かめて決める */
function sendVoice(t, label) { if (!t || !t.blob) return; try { window.parent.postMessage({ gg: 'audio', blob: t.blob, mime: t.mime, dur: t.dur, label }, '*'); } catch (e) {} }
let take = null;   // いまの問題の録音
function dropTake() { if (take && take.url) { try { URL.revokeObjectURL(take.url); } catch (e) {} } take = null; }
let player = null;
function stopPlay() { if (player) { try { player.pause(); } catch (e) {} player = null; } }
function stopAll() { stopPlay(); try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} }

const APP = {
  noReview: true,   // 声で こたえる練習なので、まちがえた問題の復習は 付けない
  id:'gg.serifu2',
  levelDesc(lv) { return { easy:'相手[あいて]に こたえる 場面[ばめん]・ヒント：はじめの ことば', normal:'自分[じぶん]から 話[はな]す 場面[ばめん]も・ヒント：はじめの 1字[じ]', hard:'自分[じぶん]から 話[はな]す 場面[ばめん]も・ヒントなし' }[lv]; },
  make(lv) { return sample(topicPool(SCENES, sc => P(sc.t)) || SCENES.filter(sc => SAY[lv].modes.includes(sc.mode)), SET_SIZE).map(sc => Object.assign({}, sc)); },
  instr() { return '「あなた」の セリフを 声[こえ]に 出[だ]して 言[い]って みましょう'; },
  render(q, lv, api) {
    dropTake(); stopAll();
    const L = SAY[lv];
    let hinted = false, shown = false;
    $('stage').innerHTML = sceneHTML(q);
    $('speakBtn').addEventListener('click', () => { if (REC.busy()) return; stopPlay(); speakJa(P(q.s) + '　' + (q.line ? P(q.line) : '')); });
    const box = $('choices');
    box.className = 'choices say';
    box.innerHTML = `
      ${REC.can ? `<div class="say-row">
        <button class="rec-btn" id="recBtn" type="button"><span class="ic" aria-hidden="true">●</span><span class="lb" id="recLb">${R('録音[ろくおん]する')}</span></button>
        <button class="play-btn" id="playBtn" type="button" hidden><span class="ic" aria-hidden="true">▶</span><span class="lb">${R('自分[じぶん]の 声[こえ]を 聞[き]く')}</span></button>
      </div>
      <p class="rec-state" id="recState" aria-live="polite">${R('押[お]してから 言[い]って、言[い]い おわったら もう一度[いちど] 押[お]します')}</p>`
      : `<p class="rec-state">${R('声[こえ]に 出[だ]して 言[い]って みましょう（この 端末[たんまつ]では 録音[ろくおん]できません）')}</p>`}
      <div class="say-row cue">
        ${L.hint ? `<button class="cue-btn" id="hintBtn" type="button"><span class="emo" aria-hidden="true">💡</span><span class="lb">ヒント</span></button>` : ''}
        <button class="cue-btn" id="ansBtn" type="button"><span class="lb">${R('こたえを 見[み]る')}</span></button>
      </div>
      <div class="judge" id="judge" hidden>
        <p class="j-q">${R('言[い]えましたか？')}<small>${R('こたえは 1つでは ありません。用件[ようけん]が 伝[つた]われば「言[い]えた」です')}</small></p>
        <div class="say-row">
          <button class="j-btn ok" id="jOk" type="button"><b>〇</b><span class="lb">${R('言[い]えた')}</span></button>
          <button class="j-btn ng" id="jNg" type="button"><b>×</b><span class="lb">${R('言[い]えなかった')}</span></button>
        </div>
      </div>`;
    const bub = $('myBub');
    if (REC.can) {
      const recBtn = $('recBtn'), playBtn = $('playBtn'), st = $('recState');
      const idle = () => { recBtn.classList.remove('on'); $('recLb').innerHTML = take ? R('録[と]り直[なお]す') : R('録音[ろくおん]する'); document.body.dataset.rec = ''; };
      recBtn.addEventListener('click', async () => {
        if (api.locked) return;
        if (REC.busy()) { REC.stop(); return; }
        stopAll();
        recBtn.classList.add('on'); $('recLb').innerHTML = R('とめる'); document.body.dataset.rec = '1';
        const ok = await REC.start({
          max: 20,
          onTick: s => { st.innerHTML = R('録音中[ろくおんちゅう]') + `… <b>${s}</b>` + R('秒[びょう]') + '　' + R('言[い]い おわったら「とめる」'); },
          onDone: t => {
            idle();
            if (!t) { st.innerHTML = R('音[おと]が 録[と]れませんでした。もう一度[いちど] どうぞ'); return; }
            dropTake(); take = t; idle();
            sendVoice(t, P(q.t) + '（' + (S.i + 1) + '問目）');
            playBtn.hidden = false;
            st.innerHTML = R('録音[ろくおん]しました。「自分[じぶん]の 声[こえ]を 聞[き]く」で 聞[き]けます');
          },
          onError: code => { idle(); st.innerHTML = R(REC_ERR[code] || REC_ERR.unsupported); },
        });
        if (!ok) idle();
      });
      playBtn.addEventListener('click', () => {
        if (!take || REC.busy()) return;
        stopAll();
        player = new Audio(take.url);
        player.play().catch(() => { st.innerHTML = R('再生[さいせい]できませんでした'); });
      });
    }
    if (L.hint) $('hintBtn').addEventListener('click', () => {
      if (shown || api.locked) return;
      hinted = true;
      const h = hintOf(q.a, L.hint);
      bub.innerHTML = '<span class="bub-t hint">' + R('ヒント') + '<br>「' + R(h) + '…」</span>';
      bub.classList.add('hinted');
      $('hintBtn').disabled = true;
    });
    $('ansBtn').addEventListener('click', () => {
      if (!shown && api.locked) return;
      if (REC.busy()) REC.stop();
      stopPlay();
      if (!shown) {
        shown = true;
        bub.classList.remove('hinted');
        bub.innerHTML = '<span class="bub-t">' + R(q.a) + '</span>';
        bub.classList.add('filled', 'reveal');
        if (L.hint) $('hintBtn').disabled = true;
        $('ansBtn').innerHTML = '<span class="emo" aria-hidden="true">🔊</span><span class="lb">' + R('お手本[てほん]を 聞[き]く') + '</span>';
        $('judge').hidden = false;
        try { $('judge').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {}
      }
      speakJa(P(q.a));
    });
    $('jOk').addEventListener('click', () => api.score(hinted ? 0.5 : 1));
    $('jNg').addEventListener('click', () => api.score(0));
  },
  fbText(q, pt) {
    if (pt === 1) return '〇 言[い]えました！';
    if (pt === 0.5) return '△ ヒントで 言[い]えました';
    return '× こたえの 例[れい]：「' + q.a + '」';
  },
  onEnd() {
    /* 〇×をつけたあとも、自分の声とお手本は聞き返せる */
    $('judge').hidden = true;
    ['playBtn', 'ansBtn'].forEach(id => { const b = $(id); if (b) b.disabled = false; });
    const r = $('recBtn'); if (r) r.hidden = true;
    const h = $('hintBtn'); if (h) h.hidden = true;
    const st = $('recState'); if (st && REC.can) st.innerHTML = take ? R('もう一度[いちど] 聞[き]いて くらべて みましょう') : '';
  },
  reveal() {},
  answerText(q) { return `こたえの 例[れい]：「${q.a}」`; },
  itemLabel(q) { return P(q.t); },
  legend: '〇 = 言[い]えた（1点[てん]）　△ = ヒントを 見[み]て 言[い]えた（0.5点[てん]）　× = 言[い]えなかった（0点[てん]）',
  onFinish() { stopAll(); REC.release(); dropTake(); document.body.dataset.rec = ''; },
  onQuit() { stopAll(); REC.release(); dropTake(); document.body.dataset.rec = ''; },
};

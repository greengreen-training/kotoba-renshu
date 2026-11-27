/* 音を選ぶ練習（上級）— 1つの ことばに 空白が 2つ。どちらの 空白から 埋めても よい。
   ことば・絵・読み上げ・効果音は「音を選ぶ練習」と同じものを使う（3文字以上の ことばだけ）。
   簡単：3文字の ことば・空白は はなれた 2か所・6択（遠い 音）
   普通：3〜4文字・空白は どこでも・6択（にた 音 2つ）
   難しい：4文字以上の 長い ことば・となり合う 空白も・8択（にた 音 4つ） */
/*@@ONIN_DATA@@*/

/* にた音：同じ行（子音が同じ）か、同じ段（母音が同じ） */
const ROWS2 = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や ゆ よ', 'らりるれろ', 'わ    ',
               'がぎぐげご', 'ざじずぜぞ', 'だ  でど', 'ばびぶべぼ', 'ぱぴぷぺぽ'];
function similar(m) {
  const out = [];
  ROWS2.forEach(r => {
    const ci = r.indexOf(m); if (ci < 0) return;
    for (const ch of r) if (ch !== ' ' && ch !== m) out.push(ch);
    ROWS2.forEach(r2 => { const c = r2[ci]; if (c && c !== ' ' && c !== m) out.push(c); });
  });
  if (m === 'ん') out.push('む', 'ぬ', 'う', 'る');
  return [...new Set(out)];
}
const ALLW = [].concat(DATA.easy, DATA.normal, DATA.hard).filter(q => [...q.word].length >= 3);
const O2 = {
  easy:   { pool: q => [...q.word].length === 3, n: 6, sim: 0, apart: true },
  normal: { pool: q => [...q.word].length <= 4, n: 6, sim: 2, apart: false },
  hard:   { pool: q => [...q.word].length >= 4, n: 8, sim: 4, apart: false },
};
function pickBlanks(len, apart) {
  const pairs = [];
  for (let a = 0; a < len; a++) for (let b = a + 1; b < len; b++) if (!apart || b - a >= 2) pairs.push([a, b]);
  return pairs[randInt(pairs.length)];
}

const APP = {
  id:'gg.oto2',
  levelDesc(lv) { return { easy:'3文字[もじ]の ことば・はなれた 空白[くうはく]・6択', normal:'3〜4文字[もじ]・にた 音[おと]も まざる・6択', hard:'長[なが]い ことば・となり合[あ]う 空白[くうはく]も・8択' }[lv]; },
  make(lv) {
    const L = O2[lv];
    return sample(ALLW.filter(L.pool), SET_SIZE).map(q => {
      const morae = [...q.word], blanks = pickBlanks(morae.length, L.apart);
      const ans = [...new Set(blanks.map(i => morae[i]))];
      const used = new Set(ans);
      const take = (list, k) => { const got = []; for (const m of shuffle(list)) { if (got.length >= k) break; if (!used.has(m)) { used.add(m); got.push(m); } } return got; };
      const simPool = [].concat(...ans.map(similar));
      const n = optN(L.n, ans.length + 1, 8);
      const near = take(simPool, Math.min(L.sim, n - ans.length - 1));
      const far = take(q.dist.concat(shuffle(simPool)), n - ans.length - near.length);
      return Object.assign({}, q, { blanks, opts: shuffle(ans.concat(near, far)) });
    });
  },
  instr() { return '？に 入[はい]る 音[おと]を 2つ えらんで ください'; },
  render(q, lv, api) {
    const morae = [...q.word], left = q.blanks.slice();
    const ill = q.img ? `<img src="${q.img}" alt="">` : q.svg ? SVGS[q.svg] : `<span class="emo">${q.emoji}</span>`;
    $('stage').innerHTML = `<div class="stim"><div class="pic-card">${ill}</div><div class="kanji${q.kanji.length >= 3 ? ' long' : ''}">${q.kanji}</div></div>
      <div class="mora-row${morae.length >= 5 ? ' many' : ''}">${morae.map((m, i) =>
        q.blanks.includes(i) ? `<span class="mora blank-cell current" id="oc${i}">？</span>` : `<span class="mora">${m}</span>`).join('')}</div>
      <p class="left-note" id="leftNote">${R('のこり')} <b>2</b></p>`;
    const box = $('choices');
    box.dataset.n = q.opts.length;
    q.opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ch kana'; b.textContent = o; b._v = o;
      b.addEventListener('click', () => {
        if (api.locked || b.disabled) return;
        const at = left.find(i => morae[i] === o);
        if (at != null) {
          left.splice(left.indexOf(at), 1);
          const cell = $('oc' + at); cell.textContent = o; cell.classList.remove('current'); cell.classList.add('filled');
          if (!left.some(i => morae[i] === o)) { b.classList.add('ok'); b.disabled = true; }
          if (!left.length) { $('leftNote').hidden = true; soundCorrect(); api.solve(); }
          else { soundTick(); $('leftNote').innerHTML = R('のこり') + ' <b>' + left.length + '</b>'; }
        } else { soundWrong(); api.miss(b); }
      });
      box.appendChild(b);
    });
    q._left = left;
  },
  reveal(q) {
    const morae = [...q.word];
    (q._left || q.blanks).forEach(i => { const c = $('oc' + i); c.textContent = morae[i]; c.classList.remove('current'); c.classList.add('reveal'); });
    const ln = $('leftNote'); if (ln) ln.hidden = true;
    revealChoice(o => (q._left || []).some(i => morae[i] === o));
  },
  answerText(q) { return `こたえは 「${q.word}」 です`; },
  itemLabel(q) { return q.word; },
  onEnd(q) { setTimeout(() => speak(q.word), 450); },
  onQuit() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} },
};

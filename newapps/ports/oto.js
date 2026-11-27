/* 音を選ぶ練習（音韻選択課題）— 問題・ルールは元のアプリのまま、画面だけ共通デザインに */
/*@@ONIN_DATA@@*/

const APP = {
  id:'gg.oto',
  typeLabel:'練習[れんしゅう]の しかたを えらぶ',
  types:[ { key:'single', name:'一文字[ひともじ]を 埋[う]める' }, { key:'all', name:'全部[ぜんぶ]の 文字[もじ]を 埋[う]める' } ],
  levelDesc(lv, type) {
    if (type === 'all') return { easy:'よく 使[つか]う ことば・6択', normal:'にた 音[おと]も まざる・6択', hard:'長[なが]い ことばも・6択' }[lv];
    return { easy:'よく 使[つか]う ことば・はじめの 音[おと]・6択', normal:'はじめか おわりの 音[おと]・にた 音[おと]も・6択', hard:'長[なが]い ことばも・どこの 音[おと]でも・6択' }[lv];
  },
  make(lv) { return sample(DATA[lv], SET_SIZE); },
  instr() { return S.type === 'all' ? 'ことばの 音[おと]を はじめから じゅんに えらんで ください' : '？に 入[はい]る 音[おと]を えらんで ください'; },
  render(q, lv, api) {
    const morae = [...q.word], all = S.type === 'all';
    let fill = 0;
    const ill = q.img ? `<img src="${q.img}" alt="">` : q.svg ? SVGS[q.svg] : `<span class="emo">${q.emoji}</span>`;
    $('stage').innerHTML = `<div class="stim"><div class="pic-card">${ill}</div><div class="kanji${q.kanji.length >= 3 ? ' long' : ''}">${q.kanji}</div></div>
      <div class="mora-row${morae.length >= 5 ? ' many' : ''}">${morae.map((m, i) =>
        all ? `<span class="mora blank-cell${i === 0 ? ' current' : ''}" id="oc${i}">${i === 0 ? '？' : ''}</span>`
            : i === q.blank ? `<span class="mora blank-cell current" id="oc${i}">？</span>` : `<span class="mora">${m}</span>`).join('')}</div>`;
    let opts;
    if (!all) opts = shuffle([morae[q.blank]].concat(sample(q.dist, optN(q.dist.length + 1, 2, q.dist.length + 1) - 1)));
    else {
      const uniq = [...new Set(morae)];
      opts = shuffle(uniq.concat(q.dist.filter(d => !uniq.includes(d)).slice(0, Math.max(1, optN(6, 2, 8) - uniq.length))));
    }
    const box = $('choices');
    box.dataset.n = opts.length;
    opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ch kana'; b.textContent = o; b._v = o;
      b.addEventListener('click', () => {
        if (api.locked || b.disabled) return;
        const pos = all ? fill : q.blank;
        if (o === morae[pos]) {
          const cell = $('oc' + pos); cell.textContent = o; cell.classList.remove('current'); cell.classList.add('filled');
          if (!all) { b.classList.add('ok'); soundCorrect(); api.solve(); return; }
          fill++;
          if (!morae.slice(fill).includes(o)) { b.classList.add('used'); b.disabled = true; }
          if (fill >= morae.length) { soundCorrect(); api.solve(); }
          else { soundTick(); const nx = $('oc' + fill); nx.classList.add('current'); nx.textContent = '？'; }
        } else {
          soundWrong();
          if (all && morae.slice(fill).includes(o)) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); api.miss(null, missAt(o, morae[pos], pos, true)); }
          else api.miss(b, missAt(o, morae[pos], pos));
        }
      });
      box.appendChild(b);
    });
    q._fill = () => fill;
  },
  reveal(q) {
    const morae = [...q.word];
    if (S.type !== 'all') { const c = $('oc' + q.blank); c.textContent = morae[q.blank]; c.classList.remove('current'); c.classList.add('reveal'); revealChoice(o => o === morae[q.blank]); }
    else for (let i = q._fill ? q._fill() : 0; i < morae.length; i++) { const c = $('oc' + i); c.textContent = morae[i]; c.classList.remove('current'); c.classList.add('reveal'); }
  },
  answerText(q) { return `こたえは 「${q.word}」 です`; },
  itemLabel(q) { return q.word; },
  /* 音の分析：聞いた文字の場所（1つだけ聞くときは その文字目。全部のときは なし＝全部） */
  itemTarget(q) { return S.type === 'all' ? '' : String(q.blank + 1); },
  onEnd(q) { setTimeout(() => speak(q.word), 450); },
  onQuit() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} },
};

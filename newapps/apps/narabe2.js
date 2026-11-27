/* ことば並べ替え（上級）：小さい「ゃ・ゅ・ょ・っ」や のばす音「ー」の入ったことばを、絵カードを見て字の順に並べる
   [絵, ことば]。1字＝1枚（小さい字も1枚）。
   普通・難しいでは、まちがえやすい字（大きい「つ」と小さい「っ」、「ー」と「オ」など）が まざる */
const NB2 = {
  easy:   { extra:0, words:[['🚂','きしゃ'],['🍵','おちゃ'],['🐉','りゅう'],['🎫','きっぷ'],['🎺','らっぱ'],['🍃','はっぱ'],['⛵','ヨット'],['🛏️','ベッド'],['🍰','ケーキ'],['🍛','カレー'],['🧀','チーズ'],['🎸','ギター'],['🚃','でんしゃ'],['🥒','きゅうり'],['🫖','きゅうす'],['🥄','スプーン'],['👕','シャツ']] },
  normal: { extra:1, words:[['⚽','サッカー'],['🧃','ジュース'],['☕','コーヒー'],['🫑','ピーマン'],['🍜','ラーメン'],['🚓','パトカー'],['🚕','タクシー'],['🏫','がっこう'],['🚀','ロケット'],['💉','ちゅうしゃ'],['🥟','ぎょうざ'],['🏥','びょういん'],['🚲','じてんしゃ'],['🔪','ほうちょう'],['🚚','トラック'],['🚿','シャワー'],['🥔','じゃがいも']] },
  hard:   { extra:2, words:[['🚑','きゅうきゅうしゃ'],['🚒','しょうぼうしゃ'],['🥛','ぎゅうにゅう'],['🚁','ヘリコプター'],['🍫','チョコレート'],['🛹','スケートボード'],['🛼','ローラースケート'],['🍔','ハンバーガー'],['🌷','チューリップ'],['🦋','ちょうちょ'],['🥦','ブロッコリー'],['🍍','パイナップル'],['🏣','ゆうびんきょく']] },
};
/* 小さい字 ⇔ 大きい字 */
const SMALL_BIG = { 'ゃ':'や','ゅ':'ゆ','ょ':'よ','っ':'つ','ャ':'ヤ','ュ':'ユ','ョ':'ヨ','ッ':'ツ','ァ':'ア','ィ':'イ','ゥ':'ウ','ェ':'エ','ォ':'オ' };
const BIG_SMALL = Object.fromEntries(Object.entries(SMALL_BIG).map(([s, b]) => [b, s]));
/* 字の母音（「ー」のかわりに書きまちがえやすい字を決めるため） */
const VOWEL_OF = {};
[['ア','アカサタナハマヤラワガザダバパャァ'],['イ','イキシチニヒミリギジヂビピィ'],['ウ','ウクスツヌフムユルグズヅブプュゥ'],['エ','エケセテネヘメレゲゼデベペェ'],['オ','オコソトノホモヨロヲゴゾドボポョォ']]
  .forEach(([v, s]) => [...s].forEach(c => { VOWEL_OF[c] = v; }));
const isKata = w => /[ァ-ヶー]/.test(w);
const toKata2 = c => c.replace(/[ぁ-ゖ]/g, x => String.fromCharCode(x.charCodeAt(0) + 0x60));
const toHira2 = c => c.replace(/[ァ-ヶ]/g, x => String.fromCharCode(x.charCodeAt(0) - 0x60));

function confusables(word) {
  const chars = [...word], out = [];
  chars.forEach((c, i) => {
    if (SMALL_BIG[c]) out.push(SMALL_BIG[c]);                    // 小さい字 → 大きい字
    if (BIG_SMALL[c]) out.push(BIG_SMALL[c]);                    // 大きい字 → 小さい字
    if (c === 'ー' && i > 0) { const v = VOWEL_OF[toKata2(chars[i - 1])]; if (v) out.push(v); }   // ケーキ → ケエキ
    if (!isKata(word) && i > 0 && (c === 'う' || c === 'い')) {   // がっこう → がっこお／とけい → とけえ
      const v = VOWEL_OF[toKata2(chars[i - 1])];
      if (c === 'う' && v === 'オ') out.push('お');
      if (c === 'い' && v === 'エ') out.push('え');
    }
  });
  if (!isKata(word)) out.push('っ', 'ゃ', 'ゅ', 'ょ', 'つ', 'や', 'ゆ', 'よ'); else out.push('ッ', 'ャ', 'ュ', 'ョ', 'ー', 'ツ');
  const kata = isKata(word);
  return [...new Set(out.map(c => (kata ? toKata2(c) : c === 'ー' ? c : toHira2(c))))].filter(c => !chars.includes(c));
}
function extraTiles2(word, n) {
  if (!n) return [];
  const all = confusables(word), first = all.slice(0, Math.max(0, all.length - 8));   // 言葉から出たものを先に
  const picks = sample(first.length ? first : all, n);
  if (picks.length < n) picks.push(...sample(all.filter(c => !picks.includes(c)), n - picks.length));
  return picks;
}

/* 字を まぜる。まぜた結果が ことばの順 そのまま（ほかの字を のぞいて 読むと 正解）に ならないように する */
function mixTiles(word, tiles) {
  const w = [...word], set = new Set(w);
  for (let k = 0; k < 30; k++) { const t = shuffle(tiles); if (t.filter(c => set.has(c)).join('') !== w.join('')) return t; }
  return shuffle(tiles);
}

const APP = {
  id:'gg.narabe2',
  levelDesc(lv) { return { easy:'3〜4文字[もじ]・使[つか]う 字[じ]だけ', normal:'4〜5文字[もじ]・まちがえやすい 字[じ]が 1つ 多[おお]い', hard:'5〜8文字[もじ]・まちがえやすい 字[じ]が 2つ 多[おお]い' }[lv]; },
  make(lv) {
    const L = NB2[lv];
    return sample(L.words, SET_SIZE).map(([emo, word]) => ({ emo, word, tiles: mixTiles(word, [...word].concat(extraTiles2(word, optN(L.extra, 0, 4)))) }));
  },
  instr() { return '絵[え]を 見[み]て、字[じ]を じゅんばんに えらんで ください（小[ちい]さい 字[じ]も 1まいです）'; },
  render(q, lv, api) {
    const chars = [...q.word];
    let cur = 0;
    $('stage').innerHTML = `<div class="pic-card"><span class="emo">${q.emo}</span></div>
      <div class="mora-row fit" style="--n:${chars.length}">${chars.map((_, i) => `<span class="mora blank-cell${i === 0 ? ' current' : ''}" id="nb${i}">${i === 0 ? '？' : ''}</span>`).join('')}</div>`;
    const box = $('choices');
    box.dataset.n = q.tiles.length;
    box.classList.add('tiles');
    q.tiles.forEach(t => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ch kana'; b.textContent = t;
      b.addEventListener('click', () => {
        if (api.locked || b.disabled) return;
        if (t === chars[cur]) {
          const cell = $('nb' + cur);
          cell.textContent = t; cell.classList.remove('current'); cell.classList.add('filled');
          b.classList.add('used'); b.disabled = true;
          cur++;
          if (cur >= chars.length) api.solve();
          else { const nx = $('nb' + cur); nx.classList.add('current'); nx.textContent = '？'; }
        } else if (chars.slice(cur).includes(t)) {
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');   // あとで使う字は残す
          api.miss(null, t + '（順番ちがい）');
        } else api.miss(b);
      });
      box.appendChild(b);
    });
    q._cur = () => cur;
  },
  reveal(q) {
    const chars = [...q.word], from = q._cur ? q._cur() : 0;
    for (let i = from; i < chars.length; i++) { const c = $('nb' + i); c.textContent = chars[i]; c.classList.remove('current'); c.classList.add('reveal'); }
  },
  answerText(q) { return `こたえは 「${q.word}」 です`; },
  itemLabel(q) { return q.word; },
};

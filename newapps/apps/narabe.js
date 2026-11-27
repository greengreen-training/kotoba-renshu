/* ことば並び替え：絵カードを見て、バラバラの字をことばの順に並べる
   [絵, ことば]（小さい字「ゃ・ゅ・ょ・っ」と のばす音「ー」は使わない） */
const NB = {
  easy:   { extra:0, words:[['🐈','ねこ'],['🐕','いぬ'],['🐦','とり'],['🐒','さる'],['🐄','うし'],['🐎','うま'],['🦀','かに'],['🐙','たこ'],['🐻','くま'],['⭐','ほし'],['🌙','つき'],['👟','くつ'],['☂️','かさ'],['🪑','いす'],['🔑','かぎ'],['🚢','ふね'],['🐢','かめ'],['🍆','なす'],['🚗','くるま'],['🍎','りんご'],['🐟','さかな'],['🥚','たまご'],['👓','めがね'],['✂️','はさみ'],['🍓','いちご'],['🍇','ぶどう'],['🍊','みかん'],['🌷','はな']] },
  normal: { extra:1, words:[['🐇','うさぎ'],['🦊','きつね'],['🦝','たぬき'],['🐭','ねずみ'],['🐑','ひつじ'],['🍉','すいか'],['💍','ゆびわ'],['🪞','かがみ'],['💊','くすり'],['☎️','でんわ'],['✉️','てがみ'],['🕰️','とけい'],['🍌','バナナ'],['🍅','トマト'],['🐼','パンダ'],['🎹','ピアノ'],['📺','テレビ'],['🐸','かえる'],['🐫','らくだ'],['🧹','ほうき'],['🪜','はしご'],['🕯️','ろうそく'],['✏️','えんぴつ'],['🥕','にんじん']] },
  hard:   { extra:2, words:[['🧤','てぶくろ'],['🧦','くつした'],['🌻','ひまわり'],['⚡','かみなり'],['🐔','にわとり'],['🦉','ふくろう'],['🐌','かたつむり'],['🌽','とうもろこし'],['🍒','さくらんぼ'],['🚄','しんかんせん'],['⛄','ゆきだるま'],['🍙','おにぎり'],['✈️','ひこうき'],['🐧','ペンギン'],['🌵','サボテン'],['🎻','バイオリン'],['🐋','くじら'],['🐗','いのしし'],['🐞','てんとうむし'],['🧄','にんにく'],['🍠','さつまいも'],['🎈','ふうせん'],['💎','ほうせき']] },
};
const H_SEION = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわん'.split('');
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
const toHira = s => s.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
/* 母音（段）をそろえた、にた音の字をえらぶ */
const VOWEL = {};
['あいうえお','かきくけこ','さしすせそ','たちつてと','なにぬねの','はひふへほ','まみむめも','や ゆ よ','らりるれろ','わ   を'].forEach(row => row.split('').forEach((k, i) => { if (k.trim()) VOWEL[k] = i; }));
const baseOf = k => ({ が:'か',ぎ:'き',ぐ:'く',げ:'け',ご:'こ',ざ:'さ',じ:'し',ず:'す',ぜ:'せ',ぞ:'そ',だ:'た',ぢ:'ち',づ:'つ',で:'て',ど:'と',ば:'は',び:'ひ',ぶ:'ふ',べ:'へ',ぼ:'ほ',ぱ:'は',ぴ:'ひ',ぷ:'ふ',ぺ:'へ',ぽ:'ほ' })[k] || k;

function extraTiles(word, n) {
  if (!n) return [];
  const kata = /[ァ-ヶ]/.test(word), hira = toHira(word).split('');
  const vowels = new Set(hira.map(k => VOWEL[baseOf(k)]).filter(v => v != null));
  const pool = H_SEION.filter(k => !hira.includes(k) && !hira.map(baseOf).includes(k));
  const near = pool.filter(k => vowels.has(VOWEL[k]));
  const picks = sample(near, n);
  if (picks.length < n) picks.push(...sample(pool.filter(k => !picks.includes(k)), n - picks.length));
  return kata ? picks.map(toKata) : picks;
}

/* 字を まぜる。まぜた結果が ことばの順 そのまま（ほかの字を のぞいて 読むと 正解）に ならないように する */
function mixTiles(word, tiles) {
  const w = [...word], set = new Set(w);
  for (let k = 0; k < 30; k++) { const t = shuffle(tiles); if (t.filter(c => set.has(c)).join('') !== w.join('')) return t; }
  return shuffle(tiles);
}

const APP = {
  id:'gg.narabe',
  levelDesc(lv) { return { easy:'2〜3文字[もじ]・使[つか]う 字[じ]だけ', normal:'3〜4文字[もじ]・字[じ]が 1つ 多[おお]い', hard:'4〜6文字[もじ]・字[じ]が 2つ 多[おお]い' }[lv]; },
  make(lv) {
    const L = NB[lv];
    return sample(L.words, SET_SIZE).map(([emo, word]) => {
      const tiles = mixTiles(word, word.split('').concat(extraTiles(word, optN(L.extra, 0, 4))));
      return { emo, word, tiles };
    });
  },
  instr() { return '絵[え]を 見[み]て、字[じ]を じゅんばんに えらんで ください'; },
  render(q, lv, api) {
    const chars = q.word.split('');
    let cur = 0;
    $('stage').innerHTML = `<div class="pic-card"><span class="emo">${q.emo}</span></div>
      <div class="mora-row${chars.length >= 5 ? ' many' : ''}">${chars.map((_, i) => `<span class="mora blank-cell${i === 0 ? ' current' : ''}" id="nb${i}">${i === 0 ? '？' : ''}</span>`).join('')}</div>`;
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
          /* あとで使う字は押せるまま残す（まちがいの回数だけ数える） */
          b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
          api.miss(null, t + '（順番ちがい）');
        } else api.miss(b);
      });
      box.appendChild(b);
    });
    q._cur = () => cur;
  },
  reveal(q) {
    const chars = q.word.split(''), from = q._cur ? q._cur() : 0;
    for (let i = from; i < chars.length; i++) { const c = $('nb' + i); c.textContent = chars[i]; c.classList.remove('current'); c.classList.add('reveal'); }
  },
  answerText(q) { return `こたえは 「${q.word}」 です`; },
  itemLabel(q) { return q.word; },
};

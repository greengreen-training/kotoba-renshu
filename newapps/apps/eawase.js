/* 絵合わせ：お手本と同じものを選ぶ（ことばと絵・同じ絵・形・色・まぜる） */
/* --- ことばと絵：仲間ごとの絵カード（同じ仲間＝にたもの） --- */
const WORD_GROUPS = [
  [['🍎','りんご'],['🍌','バナナ'],['🍇','ぶどう'],['🍊','みかん'],['🍑','もも'],['🍒','さくらんぼ'],['🍋','レモン'],['🍐','なし']],
  [['🥕','にんじん'],['🥒','きゅうり'],['🍆','なす'],['🥦','ブロッコリー'],['🧅','玉[たま]ねぎ'],['🌽','とうもろこし'],['🥔','じゃがいも'],['🍅','トマト']],
  [['🐕','犬[いぬ]'],['🐈','猫[ねこ]'],['🐘','ぞう'],['🦒','きりん'],['🐒','さる'],['🐻','くま'],['🐄','牛[うし]'],['🐇','うさぎ']],
  [['🚗','車[くるま]'],['🚌','バス'],['🚃','電車[でんしゃ]'],['✈️','飛行機[ひこうき]'],['🚢','船[ふね]'],['🚲','自転車[じてんしゃ]'],['🚑','救急車[きゅうきゅうしゃ]'],['🚁','ヘリコプター']],
  [['👕','シャツ'],['👖','ズボン'],['🧥','コート'],['👘','着物[きもの]'],['👟','靴[くつ]'],['👒','帽子[ぼうし]'],['🧦','靴下[くつした]'],['🧤','手袋[てぶくろ]']],
  [['☂️','傘[かさ]'],['🔑','鍵[かぎ]'],['🕰️','時計[とけい]'],['📺','テレビ'],['☎️','電話[でんわ]'],['🪑','椅子[いす]'],['👓','めがね'],['📖','本[ほん]']],
  [['✏️','鉛筆[えんぴつ]'],['✂️','はさみ'],['📏','ものさし'],['🔪','包丁[ほうちょう]'],['🥄','スプーン'],['🥢','はし'],['🍳','フライパン'],['🔨','かなづち']],
  [['🐟','魚[さかな]'],['🐙','たこ'],['🦀','かに'],['🦐','えび'],['🐢','亀[かめ]'],['🐸','かえる'],['🐓','にわとり'],['🐝','はち']],
];
/* --- 同じ絵：よくにた絵のグループ --- */
const PIC_SETS = [
  ['🍎','🍅','🍒','🍓','🍑','🌶️'], ['🍌','🌽','🍋','🧀','🌕','⭐'], ['🐕','🐈','🦊','🐺','🐻','🐩'],
  ['🐦','🐤','🐧','🦆','🕊️','🦜'], ['🚗','🚕','🚙','🚓','🚑','🚌'], ['⚽','🏀','🏐','⚾','🎾','🏈'],
  ['😀','😢','😠','😴','😮','😍'], ['🌷','🌹','🌺','🌸','🌼','🌻'], ['🕐','🕑','🕒','🕓','🕔','🕕'], ['🏠','🏡','🏢','🏫','🏥','🏪'],
];
/* --- 形 --- */
const poly = (n, rot, r) => { const p = []; for (let i = 0; i < n; i++) { const a = (rot + 360 * i / n) * Math.PI / 180; p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1)); } return `<polygon points="${p.join(' ')}"/>`; };
const star = (n, r1, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = (-90 + 180 * i / n) * Math.PI / 180; p.push((50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1)); } return `<polygon points="${p.join(' ')}"/>`; };
const SHAPES = {
  circle:'<circle cx="50" cy="50" r="40"/>', ellipse:'<ellipse cx="50" cy="50" rx="44" ry="27"/>', 'ellipse-v':'<ellipse cx="50" cy="50" rx="27" ry="44"/>',
  tri:poly(3,-90,44), 'tri-down':poly(3,90,44), square:'<rect x="15" y="15" width="70" height="70"/>', rect:'<rect x="7" y="25" width="86" height="50"/>', 'rect-v':'<rect x="25" y="7" width="50" height="86"/>',
  diamond:poly(4,-90,44), pentagon:poly(5,-90,43), hexagon:poly(6,0,43), octagon:poly(8,22.5,43),
  star5:star(5,46,19), star6:star(6,45,24), star4:star(4,46,17), star8:star(8,45,28),
  heart:'<path d="M50 86C22 64 8 50 8 33 8 20 18 11 30 11c9 0 16 5 20 12 4-7 11-12 20-12 12 0 22 9 22 22 0 17-14 31-42 53z"/>',
  moon:'<path d="M60 10A42 42 0 1 0 60 90A50 50 0 0 1 60 10z"/>',
  cross:'<path d="M37 8h26v29h29v26H63v29H37V63H8V37h29z"/>', xcross:'<path d="M37 8h26v29h29v26H63v29H37V63H8V37h29z" transform="rotate(45 50 50)"/>',
  drop:'<path d="M50 6C50 6 18 44 18 63a32 32 0 0 0 64 0C82 44 50 6 50 6z"/>', semicircle:'<path d="M8 66a42 42 0 0 1 84 0z"/>',
  trapezoid:'<polygon points="30,22 70,22 92,78 8,78"/>',
  'arrow-r':'<path d="M8 38h48V18l36 32-36 32V62H8z"/>', 'arrow-l':'<path d="M8 38h48V18l36 32-36 32V62H8z" transform="rotate(180 50 50)"/>',
  'arrow-u':'<path d="M8 38h48V18l36 32-36 32V62H8z" transform="rotate(-90 50 50)"/>', 'arrow-d':'<path d="M8 38h48V18l36 32-36 32V62H8z" transform="rotate(90 50 50)"/>',
};
const SHAPE_EASY = ['circle','tri','square','star5','heart','moon','cross','arrow-r'];
const SHAPE_SETS = [
  ['tri','tri-down','diamond','square','pentagon','trapezoid'],
  ['circle','ellipse','ellipse-v','octagon','hexagon','semicircle'],
  ['square','rect','rect-v','diamond','trapezoid','octagon'],
  ['star5','star6','star4','star8','cross','xcross'],
  ['heart','drop','circle','moon','semicircle','ellipse'],
  ['arrow-r','arrow-l','arrow-u','arrow-d','tri','tri-down'],
];
const shapeSVG = k => `<svg class="shape" viewBox="0 0 100 100" aria-hidden="true">${SHAPES[k]}</svg>`;
/* --- 色 --- */
const COLOR_EASY = ['#d93636','#2f62c8','#f2c81a','#2f9a4a','#222222','#ffffff','#f08a24','#7d4cc4','#f07aa8','#8a5a2b','#9a9a9a','#6cc4ee'];
const COLOR_NEAR = { '#d93636':['#f08a24','#f07aa8'], '#2f62c8':['#6cc4ee','#7d4cc4'], '#f2c81a':['#f08a24'], '#2f9a4a':['#6cc4ee'], '#222222':['#8a5a2b','#9a9a9a'],
  '#ffffff':['#9a9a9a','#f2c81a'], '#f08a24':['#d93636','#f2c81a','#8a5a2b'], '#7d4cc4':['#2f62c8','#f07aa8'], '#f07aa8':['#d93636','#7d4cc4'], '#8a5a2b':['#f08a24','#222222'], '#9a9a9a':['#222222','#ffffff'], '#6cc4ee':['#2f62c8','#2f9a4a'] };
const COLOR_SETS = [
  ['#b71c1c','#e53935','#ff7043','#f06292','#ad1457','#ef9a9a'], ['#0d47a1','#1e88e5','#64b5f6','#3949ab','#00acc1','#b3d9f7'],
  ['#1b5e20','#2e7d32','#66bb6a','#9ccc65','#26a69a','#c5e1a5'], ['#f9a825','#ffeb3b','#fb8c00','#ffcc80','#c0ca33','#e65100'],
  ['#4a148c','#7e57c2','#ab47bc','#ce93d8','#5c6bc0','#880e4f'], ['#3e2723','#795548','#bcaaa4','#424242','#9e9e9e','#d7ccc8'],
];
const swatch = c => `<span class="swatch" style="background:${c}"></span>`;

const N_OPTS = { easy:3, normal:4, hard:6 };
const TYPE_NAMES = { word:'ことばと 絵[え]', pic:'同[おな]じ 絵[え]', shape:'形[かたち]', color:'色[いろ]' };

function oneFromGroupsFar(groups, gi, n) {           // ちがうグループから1つずつ
  return sample(groups.map((g, i) => i).filter(i => i !== gi), n).map(i => groups[i][randInt(groups[i].length)]);
}
function makeQ(type, lv) {
  const n = optN(N_OPTS[lv], 2, 6), k = Math.min(2, n - 2);   // k：にた ものの数（普通）
  if (type === 'word') {
    const gi = randInt(WORD_GROUPS.length), g = WORD_GROUPS[gi], target = g[randInt(g.length)];
    const others = g.filter(x => x !== target);
    let ds;
    if (lv === 'easy') ds = oneFromGroupsFar(WORD_GROUPS, gi, n - 1);
    else if (lv === 'normal') ds = sample(others, k).concat(oneFromGroupsFar(WORD_GROUPS, gi, n - 1 - k));
    else ds = sample(others, n - 1);
    return { type, dir: Math.random() < 0.5 ? 'w2p' : 'p2w', target, opts: shuffle([target].concat(ds)), ruby: lv !== 'hard' };
  }
  if (type === 'pic') {
    const si = randInt(PIC_SETS.length), set = PIC_SETS[si], target = set[randInt(set.length)];
    const ds = lv === 'easy' ? oneFromGroupsFar(PIC_SETS, si, n - 1) : sample(set.filter(x => x !== target), n - 1);
    return { type, target, opts: shuffle([target].concat(ds)) };
  }
  if (type === 'shape') {
    let target, ds;
    if (lv === 'easy') { target = SHAPE_EASY[randInt(SHAPE_EASY.length)]; ds = sample(SHAPE_EASY.filter(x => x !== target), n - 1); }
    else {
      const set = SHAPE_SETS[randInt(SHAPE_SETS.length)]; target = set[randInt(set.length)];
      const near = set.filter(x => x !== target);
      ds = lv === 'hard' ? sample(near, n - 1) : sample(near, k).concat(sample(Object.keys(SHAPES).filter(x => !set.includes(x)), n - 1 - k));
    }
    return { type, target, opts: shuffle([target].concat(ds)) };
  }
  /* color */
  let target, ds;
  if (lv === 'hard') { const set = COLOR_SETS[randInt(COLOR_SETS.length)]; target = set[randInt(set.length)]; ds = sample(set.filter(x => x !== target), n - 1); }
  else {
    target = COLOR_EASY[randInt(COLOR_EASY.length)];
    const near = COLOR_NEAR[target] || [];
    const far = COLOR_EASY.filter(x => x !== target && !near.includes(x));
    const k1 = Math.min(1, n - 2);
    ds = lv === 'easy' ? sample(far, n - 1) : sample(near, k1).concat(sample(far, n - 1 - k1));
  }
  return { type, target, opts: shuffle([target].concat(ds)) };
}
const SHAPE_JP = { circle:'丸', ellipse:'横長の丸', 'ellipse-v':'縦長の丸', tri:'三角', 'tri-down':'逆三角', square:'四角', rect:'横長の四角', 'rect-v':'縦長の四角', diamond:'ひし形', pentagon:'五角形', hexagon:'六角形', octagon:'八角形', star5:'星', star6:'六つ星', star4:'四つ星', star8:'八つ星', heart:'ハート', moon:'三日月', cross:'十字', xcross:'ばつ', drop:'しずく', semicircle:'半円', trapezoid:'台形', 'arrow-r':'右やじるし', 'arrow-l':'左やじるし', 'arrow-u':'上やじるし', 'arrow-d':'下やじるし' };
const COLOR_JP = { '#d93636':'赤', '#2f62c8':'青', '#f2c81a':'黄', '#2f9a4a':'緑', '#222222':'黒', '#ffffff':'白', '#f08a24':'オレンジ', '#7d4cc4':'紫', '#f07aa8':'ピンク', '#8a5a2b':'茶', '#9a9a9a':'灰', '#6cc4ee':'水色' };
const qKey = q => q.type + ':' + (Array.isArray(q.target) ? q.target[0] : q.target);

const APP = {
  id:'gg.eawase',
  typeLabel:'しゅるいを えらぶ',
  types:[ { key:'word', name:'ことばと 絵[え]' }, { key:'pic', name:'同[おな]じ 絵[え]' }, { key:'shape', name:'形[かたち]' }, { key:'color', name:'色[いろ]' }, { key:'mix', name:'まぜる' } ],
  levelDesc(lv, type) {
    const d = {
      word:  { easy:'3択・ちがう 仲間[なかま]の 絵[え]', normal:'4択・にた 仲間[なかま]も まざる', hard:'6択・同[おな]じ 仲間[なかま]・ふりがな なし' },
      pic:   { easy:'3択・ちがう 絵[え]', normal:'4択・にた 絵[え]', hard:'6択・よく にた 絵[え]' },
      shape: { easy:'3択・ちがう 形[かたち]', normal:'4択・にた 形[かたち]も まざる', hard:'6択・よく にた 形[かたち]（向[む]きも）' },
      color: { easy:'3択・はっきり ちがう 色[いろ]', normal:'4択・にた 色[いろ]も まざる', hard:'6択・にた 色[いろ]' },
      mix:   { easy:'3択・4つの しゅるいを まぜて', normal:'4択・4つの しゅるいを まぜて', hard:'6択・4つの しゅるいを まぜて' },
    };
    return d[type][lv];
  },
  make(lv, type) {
    const types = type === 'mix' ? shuffle(['word','pic','shape','color','word','pic','shape','color','word','pic','shape','color']).slice(0, SET_SIZE) : Array(SET_SIZE).fill(type);
    const qs = [], seen = new Set();
    for (const t of types) {
      let q, guard = 0;
      do { q = makeQ(t, lv); } while (seen.has(qKey(q)) && guard++ < 40);
      seen.add(qKey(q)); qs.push(q);
    }
    return qs;
  },
  instr(q) {
    if (q.type === 'word') return q.dir === 'w2p' ? 'ことばに 合[あ]う 絵[え]を えらんで ください' : '絵[え]に 合[あ]う ことばを えらんで ください';
    return { pic:'お手本[てほん]と 同[おな]じ 絵[え]を えらんで ください', shape:'お手本[てほん]と 同[おな]じ 形[かたち]を えらんで ください', color:'お手本[てほん]と 同[おな]じ 色[いろ]を えらんで ください' }[q.type];
  },
  render(q) {
    const word = w => `<span class="lbl">${q.ruby ? R(w) : P(w)}</span>`;
    let model, face;
    if (q.type === 'word' && q.dir === 'w2p') { model = `<span class="model-word">${q.ruby ? R(q.target[1]) : P(q.target[1])}</span>`; face = o => `<span class="emo">${o[0]}</span>`; }
    else if (q.type === 'word') { model = `<span class="emo">${q.target[0]}</span>`; face = o => word(o[1]); }
    else if (q.type === 'pic') { model = `<span class="emo">${q.target}</span>`; face = o => `<span class="emo">${o}</span>`; }
    else if (q.type === 'shape') { model = shapeSVG(q.target); face = o => shapeSVG(o); }
    else { model = swatch(q.target); face = o => swatch(o); }
    $('stage').innerHTML = `<p class="model-label">お<ruby>手本<rt>てほん</rt></ruby></p><div class="model model-${q.type}${q.type === 'word' ? ' ' + q.dir : ''}">${model}</div>`;
    choiceButtons(q.opts, face, o => o === q.target);
    $('choices').classList.add('ea-' + q.type + (q.type === 'word' ? '-' + q.dir : ''));
    $('choices').querySelectorAll('.ch').forEach(b => b.classList.add('card-pick'));
  },
  reveal(q) { revealChoice(o => o === q.target); },
  answerText() { return 'こたえは 青[あお]い わくの カードです'; },
  optLabel(v, q) {
    if (Array.isArray(v)) return P(v[1]);
    if (q && q.type === 'shape') return SHAPE_JP[v] || v;
    if (q && q.type === 'color') return COLOR_JP[v] || v;
    return '';
  },
  itemLabel(q) {
    if (q.type === 'word') return 'ことば:' + P(q.target[1]) + (q.dir === 'w2p' ? '（字→絵）' : '（絵→字）');
    if (q.type === 'pic') return '絵:' + q.target;
    if (q.type === 'shape') return '形:' + (SHAPE_JP[q.target] || q.target);
    return '色:' + (COLOR_JP[q.target] || q.target);
  },
};

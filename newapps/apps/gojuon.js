/* 50音ならべ：50音表の空いたマスに入る字を選ぶ
   表は昔ながらの縦書き（右から あ行・か行…、上から あ・い・う・え・お）。null は もともと字のないマス */
const GOJUON = [
  ['あ','い','う','え','お'], ['か','き','く','け','こ'], ['さ','し','す','せ','そ'], ['た','ち','つ','て','と'],
  ['な','に','ぬ','ね','の'], ['は','ひ','ふ','へ','ほ'], ['ま','み','む','め','も'], ['や',null,'ゆ',null,'よ'],
  ['ら','り','る','れ','ろ'], ['わ',null,null,null,'を'], ['ん',null,null,null,null],
];
/* 形のにた字（難しいで使う） */
const LOOK = { あ:'おめ', い:'りこ', う:'つら', え:'んそ', お:'あむ', か:'やが', き:'さち', く:'へし', け:'はに', こ:'いに',
  さ:'きち', し:'つも', す:'むお', せ:'やも', そ:'えろ', た:'なに', ち:'さら', つ:'うし', て:'そこ', と:'こを',
  な:'たよ', に:'こけ', ぬ:'めね', ね:'れわ', の:'めあ', は:'ほけ', ひ:'いく', ふ:'ぶう', へ:'くし', ほ:'はま',
  ま:'ほも', み:'よか', む:'すお', め:'ぬあ', も:'しせ', や:'かせ', ゆ:'めわ', よ:'まな', ら:'ちう', り:'いら',
  る:'ろそ', れ:'ねわ', ろ:'るそ', わ:'ねれ', を:'とち', ん:'えそ' };
const ALL_KANA = GOJUON.flat().filter(Boolean);
const pos = {}; GOJUON.forEach((col, c) => col.forEach((k, r) => { if (k) pos[k] = [c, r]; }));
const GJ = { easy:{ k:2, blanks:1, n:3 }, normal:{ k:3, blanks:2, n:6 }, hard:{ k:5, blanks:5, n:10 } };

function gjDistractors(lv, ans, start, k) {
  const L = GJ[lv], need = optN(L.n, ans.length + 1, 10) - ans.length, out = [];
  const inWin = kana => { const c = pos[kana][0]; return c >= start && c < start + k; };
  /* list からまだ選んでいない字を max 個まで足す */
  const add = (list, max) => { let n = 0; for (const x of shuffle(list)) { if (out.length >= need || n >= (max || 99)) return; if (x && !ans.includes(x) && !out.includes(x) && pos[x]) { out.push(x); n++; } } };
  if (lv === 'easy') {
    /* まったくちがう字：同じ行・同じ段ではなく、表に見えていない字 */
    add(ALL_KANA.filter(x => !inWin(x) && ans.every(a => pos[a][0] !== pos[x][0] && pos[a][1] !== pos[x][1])));
  } else if (lv === 'normal') {
    for (const a of ans) { const [c, r] = pos[a]; add(GOJUON[c].filter(Boolean), 1); add(GOJUON.map(col => col[r]).filter(x => x && Math.abs(pos[x][0] - c) <= 2), 1); }   // 同じ行・同じ段の近い字
    add(ALL_KANA.filter(x => !inWin(x)));
  } else {
    for (const a of ans) add((LOOK[a] || '').split(''), 1);                               // 形のにた字
    for (const a of ans) { const [c, r] = pos[a]; add(GOJUON.map(col => col[r]).filter(x => x && Math.abs(pos[x][0] - c) <= 1), 1); }
    add(ALL_KANA);
  }
  return out.slice(0, need);
}

const APP = {
  id:'gg.gojuon',
  levelDesc(lv) { return { easy:'2つの 行[ぎょう]・空[あ]きが 1つ・3択', normal:'3つの 行[ぎょう]・空[あ]きが 2つ・6択', hard:'5つの 行[ぎょう]・空[あ]きが 5つ・10択（にた 形[かたち]の 字[じ]も）' }[lv]; },
  make(lv) {
    const L = GJ[lv], qs = [], used = new Set(), seenQ = new Set();
    let guard = 0;
    while (qs.length < SET_SIZE && guard++ < 2000) {
      const start = randInt(GOJUON.length - L.k + 1);
      const cells = [];
      for (let c = start; c < start + L.k; c++) for (let r = 0; r < 5; r++) if (GOJUON[c][r]) cells.push([c, r]);
      if (cells.length < L.blanks + 2) continue;
      const blanks = sample(cells, L.blanks).sort((a, b) => a[0] - b[0] || a[1] - b[1]);   // 右の行から、上から順に
      const ans = blanks.map(([c, r]) => GOJUON[c][r]);
      if (guard < 1500 && ans.some(a => used.has(a)) && lv !== 'hard') continue;
      const key = start + ':' + blanks.join('|');
      if (seenQ.has(key)) continue;
      seenQ.add(key);
      ans.forEach(a => used.add(a));
      const opts = shuffle(ans.concat(gjDistractors(lv, ans, start, L.k)));
      qs.push({ start, k: L.k, blanks, ans, opts });
    }
    return qs;
  },
  instr(q) { return q.ans.length > 1 ? '？の マスに 入[はい]る 字[じ]を 右[みぎ]から じゅんに えらんで ください' : 'あいている マスに 入[はい]る 字[じ]を えらんで ください'; },
  render(q, lv, api) {
    let cur = 0;
    const isBlank = (c, r) => q.blanks.findIndex(b => b[0] === c && b[1] === r);
    let html = `<div class="gj" style="--k:${q.k}">`;
    for (let c = q.start + q.k - 1; c >= q.start; c--) {          // 左から並べるので、右端が あ行側
      for (let r = 0; r < 5; r++) {
        const kana = GOJUON[c][r], bi = isBlank(c, r);
        if (!kana) html += '<span class="gj-cell gj-none"></span>';
        else if (bi >= 0) html += `<span class="gj-cell gj-blank${bi === 0 ? ' current' : ''}" id="gjb${bi}">？</span>`;
        else html += `<span class="gj-cell">${kana}</span>`;
      }
    }
    html += '</div>';
    $('stage').innerHTML = html;
    const box = $('choices');
    box.dataset.n = q.opts.length;
    q.opts.forEach(o => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ch kana'; b.textContent = o; b._v = o;
      b.addEventListener('click', () => {
        if (api.locked || b.disabled) return;
        if (o === q.ans[cur]) {
          const cell = $('gjb' + cur);
          cell.textContent = o; cell.classList.remove('current'); cell.classList.add('filled');
          b.classList.add('ok'); b.disabled = true;
          cur++;
          if (cur >= q.ans.length) api.solve();
          else { $('gjb' + cur).classList.add('current'); api.note('あと ' + (q.ans.length - cur) + 'つ'); }
        } else api.miss(b, missAt(o, q.ans[cur], null));
      });
      box.appendChild(b);
    });
    q._cur = () => cur;
  },
  reveal(q) {
    const from = q._cur ? q._cur() : 0;
    for (let i = from; i < q.ans.length; i++) { const cell = $('gjb' + i); cell.textContent = q.ans[i]; cell.classList.remove('current'); cell.classList.add('reveal'); }
    revealChoice(o => q.ans.slice(from).includes(o));
  },
  answerText(q) { return 'こたえは 「' + q.ans.join('」「') + '」 です'; },
  itemLabel(q) { return q.ans.join('・'); },
};

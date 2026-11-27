/* 助詞の練習 — 問題・ルールは元のアプリのまま、画面だけ共通デザインに
   s：文（＠が空欄、漢字[かな]でふりがな、空白は少し広めのすきま） a：正答 d：ちがう選択肢 */
/*@@JOSHI_DATA@@*/
const JL = { easy:0, normal:1, hard:2 };
const joshiHTML = s => R(s).replace(/ /g, '<span class="sp"></span>').replace(/＠/g, '<span class="blank" id="blank"></span>');

const APP = {
  id:'gg.joshi',
  levelDesc(lv) { return { easy:'2択・「が」と「を」', normal:'3〜4択・「に」「で」なども', hard:'5択・家[いえ]の 中[なか]の ことば' }[lv]; },
  make(lv) { return sample(DIFFS[JL[lv]].pool, SET_SIZE).map(q => Object.assign({}, q, { opts: shuffle([q.a].concat(sample(q.d, optN(q.d.length + 1, 2, q.d.length + 1) - 1))) })); },
  maxMiss(q) { return q.opts.length === 2 ? 1 : 2; },   // 2択は1回で判定（元のアプリと同じ）
  instr() { return '正[ただ]しい ことばを 1つ えらんで ください'; },
  render(q) {
    $('stage').innerHTML = `<p class="sentence">${joshiHTML(q.s)}</p>`;
    choiceButtons(q.opts, o => o, o => o === q.a, o => { const b = $('blank'); b.textContent = o; b.classList.add('filled'); });
  },
  reveal(q) { const b = $('blank'); b.textContent = q.a; b.classList.add('filled', 'reveal'); revealChoice(o => o === q.a); },
  answerText(q) { return `こたえは 「${q.a}」 です`; },
  itemLabel(q) { return P(q.s).replace('＠', '［' + q.a + '］').replace(/ /g, ''); },
};

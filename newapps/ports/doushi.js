/* 動詞の練習（動詞選択課題）— 問題・ルール（1回で判定、反対の言葉は2問つづけて出す）は元のアプリのまま、画面だけ共通デザインに */
/*@@DOUSHI_DATA@@*/

const APP = {
  id:'gg.doushi',
  maxMiss() { return 1; },   // ワンチャンス：1回押したら判定
  levelDesc(lv) { return { easy:'3択・よく 使[つか]う ことば', normal:'3択', hard:'4択・にた 意味[いみ]の ことばも' }[lv]; },
  make(lv) {
    const ds = DATASETS[lv];
    return buildQuestionOrder(ds).map(q => {
      let prev = null;
      if (q.pairId && q.pairOrder === 2) {
        const first = ds.find(x => x.pairId === q.pairId && x.pairOrder === 1);
        if (first) prev = first.stemHtml + ' ' + VERBS[first.answer].rubyHtml;
      }
      return Object.assign({}, q, { prev, opts: shuffle([q.answer].concat(sample(q.distractors, optN(q.distractors.length + 1, 2, q.distractors.length + 1) - 1))) });
    });
  },
  instr(q) { return q.prev ? '上[うえ]の 文[ぶん]と 反対[はんたい]の ことばを えらんで ください' : 'あいている ところに 入[はい]る ことばを えらんで ください'; },
  render(q) {
    $('stage').innerHTML = (q.prev ? `<p class="pair-label"><ruby>反対<rt>はんたい</rt></ruby>の <ruby>言葉<rt>ことば</rt></ruby></p><p class="pair-prev">${q.prev}<span class="arrow">⇔</span></p>` : '')
      + `<p class="sentence">${q.stemHtml}<span class="sp"></span><span class="blank" id="blank"></span></p>`;
    choiceButtons(q.opts, v => VERBS[v].rubyHtml, v => v === q.answer, v => { const b = $('blank'); b.innerHTML = VERBS[v].rubyHtml; b.classList.add('filled'); });
  },
  reveal(q) { const b = $('blank'); b.innerHTML = VERBS[q.answer].rubyHtml; b.classList.add('filled', 'reveal'); revealChoice(v => v === q.answer); },
  answerText(q) { return 'こたえは 「' + VERBS[q.answer].rubyHtml + '」 です'; },
  itemLabel(q) { return q.stemHtml.replace(/<rt>.*?<\/rt>/g, '').replace(/<[^>]+>/g, '') + '［' + q.answer + '］'; },
};

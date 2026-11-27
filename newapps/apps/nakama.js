/* 仲間えらび（カテゴリ）
   お題の仲間をぜんぶ選ぶ。1問の中で2回まちがえると、残りの正答を青で示して終わり。
   語彙：[絵, 表記]。3つ目に ['fruit'] のように書いた語は、そのお題では「ちがう仲間」として出さない（どちらとも言える語のため） */
const CATS = {
  fruit:     { name:'くだもの', fam:'food', near:['veg'], items:[['🍎','りんご'],['🍌','バナナ'],['🍇','ぶどう'],['🍊','みかん'],['🍑','もも'],['🍐','なし'],['🍒','さくらんぼ'],['🍋','レモン'],['🍍','パイナップル'],['🥝','キウイ'],['🍓','いちご',['veg']],['🍉','すいか',['veg']],['🍈','メロン',['veg']],['🥭','マンゴー'],['🫐','ブルーベリー']] },
  veg:       { name:'野菜[やさい]', fam:'food', near:['fruit'], items:[['🥕','にんじん'],['🥒','きゅうり'],['🍆','なす'],['🥦','ブロッコリー'],['🧅','玉[たま]ねぎ'],['🌽','とうもろこし'],['🥔','じゃがいも'],['🫑','ピーマン'],['🍅','トマト',['fruit']],['🧄','にんにく'],['🍠','さつまいも']] },
  dish:      { name:'料理[りょうり]', fam:'food', near:['veg','fruit'], items:[['🍙','おにぎり'],['🍣','すし'],['🍜','ラーメン'],['🍛','カレー'],['🍝','スパゲッティ'],['🍔','ハンバーガー'],['🍕','ピザ'],['🍱','お弁当[べんとう]'],['🍤','天[てん]ぷら'],['🍢','おでん'],['🥟','ぎょうざ'],['🍲','なべ',['kitchen']],['🍳','目玉焼[めだまや]き'],['🥪','サンドイッチ']] },
  drink:     { name:'飲[の]み物[もの]', fam:'food', near:['sweets','dish'], items:[['☕','コーヒー'],['🍵','お茶[ちゃ]'],['🥛','牛乳[ぎゅうにゅう]'],['🧃','ジュース'],['🍺','ビール'],['🍶','お酒[さけ]'],['🍷','ワイン'],['🥃','ウイスキー']] },
  sweets:    { name:'おかし', fam:'food', near:['fruit','drink','dish'], items:[['🍰','ケーキ'],['🍩','ドーナツ'],['🍪','クッキー'],['🍫','チョコレート'],['🍬','あめ',['weather']],['🍡','だんご'],['🍦','アイス'],['🍮','プリン'],['🍘','せんべい'],['🧁','カップケーキ'],['🍧','かき氷[ごおり]'],['🍿','ポップコーン'],['🥞','ホットケーキ']] },
  animal:    { name:'動物[どうぶつ]', fam:'life', near:[], items:[['🐕','犬[いぬ]'],['🐈','猫[ねこ]'],['🐘','ぞう'],['🦒','きりん'],['🐒','さる'],['🐻','くま'],['🐼','パンダ'],['🐄','牛[うし]'],['🐖','ぶた'],['🐎','馬[うま]'],['🐇','うさぎ'],['🦁','ライオン'],['🐯','とら'],['🦊','きつね'],['🦝','たぬき'],['🐑','ひつじ'],['🐐','やぎ'],['🦌','しか'],['🐿️','りす'],['🐭','ねずみ'],['🦍','ゴリラ'],['🐫','らくだ'],['🦓','しまうま'],['🐨','コアラ']] },
  bird:      { name:'鳥[とり]', fam:'life', near:['insect','animal'], items:[['🐓','にわとり'],['🦆','あひる'],['🦉','ふくろう'],['🐧','ペンギン'],['🦅','わし'],['🦢','白鳥[はくちょう]'],['🦜','オウム'],['🕊️','はと'],['🦩','フラミンゴ'],['🐤','ひよこ'],['🦚','くじゃく'],['🐦','小鳥[ことり]']] },
  insect:    { name:'虫[むし]', fam:'life', near:['bird'], items:[['🐝','はち'],['🦋','ちょう'],['🐜','あり'],['🐞','てんとう虫[むし]'],['🦗','こおろぎ'],['🐛','いも虫[むし]'],['🦟','か'],['🪰','はえ']] },
  sea:       { name:'海[うみ]の 生[い]き物[もの]', fam:'life', near:['animal','insect'], items:[['🐟','魚[さかな]'],['🐙','たこ'],['🦀','かに'],['🦐','えび'],['🐬','いるか'],['🐳','くじら'],['🦈','さめ'],['🐡','ふぐ'],['🦑','いか'],['🐚','貝[かい]']] },
  flower:    { name:'花[はな]', fam:'life', near:['veg'], items:[['🌷','チューリップ'],['🌻','ひまわり'],['🌹','ばら'],['🌸','桜[さくら]'],['🌺','ハイビスカス'],['🪷','はす']] },
  vehicle:   { name:'乗[の]り物[もの]', fam:'thing', near:['building'], items:[['🚗','車[くるま]'],['🚌','バス'],['🚃','電車[でんしゃ]'],['✈️','飛行機[ひこうき]'],['🚢','船[ふね]'],['🚲','自転車[じてんしゃ]'],['🚕','タクシー'],['🚑','救急車[きゅうきゅうしゃ]'],['🚒','消防車[しょうぼうしゃ]'],['🚓','パトカー'],['🏍️','バイク'],['🚁','ヘリコプター'],['🚄','新幹線[しんかんせん]'],['🚚','トラック'],['🚜','トラクター'],['🚂','汽車[きしゃ]'],['🚤','ボート']] },
  building:  { name:'建物[たてもの]', fam:'thing', near:['vehicle'], items:[['🏫','学校[がっこう]'],['🏥','病院[びょういん]'],['🏪','コンビニ'],['🏦','銀行[ぎんこう]'],['🏣','郵便局[ゆうびんきょく]'],['🏠','家[いえ]'],['🏯','お城[しろ]'],['⛩️','神社[じんじゃ]'],['🗼','タワー'],['🏢','ビル'],['🏨','ホテル']] },
  clothes:   { name:'服[ふく]', fam:'thing', near:[], items:[['👕','シャツ'],['👖','ズボン'],['👗','ワンピース'],['🧥','コート'],['👘','着物[きもの]'],['👚','ブラウス'],['🩳','半[はん]ズボン'],['👔','ワイシャツ'],['🩱','水着[みずぎ]'],['🥼','白衣[はくい]']] },
  wear:      { name:'身[み]に つける 物[もの]（服[ふく]の ほか）', fam:'thing', near:[], items:[['👟','靴[くつ]'],['👒','帽子[ぼうし]'],['🧤','手袋[てぶくろ]'],['🧣','マフラー'],['👓','めがね'],['⌚','うで時計[どけい]'],['🧦','靴下[くつした]'],['💍','指輪[ゆびわ]'],['👢','ブーツ']] },
  instrument:{ name:'楽器[がっき]', fam:'thing', near:['sport'], items:[['🎸','ギター'],['🎹','ピアノ'],['🥁','太鼓[たいこ]'],['🎺','トランペット'],['🎻','バイオリン'],['🎷','サックス'],['🪗','アコーディオン']] },
  sport:     { name:'スポーツ', fam:'thing', near:['instrument'], items:[['⚽','サッカー'],['⚾','野球[やきゅう]'],['🏀','バスケットボール'],['🎾','テニス'],['🏐','バレーボール'],['🏓','卓球[たっきゅう]'],['⛳','ゴルフ'],['🏉','ラグビー'],['🏸','バドミントン'],['🥊','ボクシング'],['🎳','ボウリング'],['⛷️','スキー']] },
  stationery:{ name:'文房具[ぶんぼうぐ]', fam:'thing', near:['kitchen','tools'], items:[['✏️','鉛筆[えんぴつ]'],['🖊️','ペン'],['✂️','はさみ',['kitchen','tools']],['📏','ものさし',['tools']],['📎','クリップ'],['🖍️','クレヨン'],['📒','ノート'],['🖌️','筆[ふで]'],['📐','三角[さんかく]じょうぎ'],['📌','画[が]びょう']] },
  kitchen:   { name:'台所[だいどころ]の 道具[どうぐ]', fam:'thing', near:['stationery','tools'], items:[['🔪','包丁[ほうちょう]'],['🍴','フォーク'],['🥄','スプーン'],['🥢','はし'],['🫖','きゅうす'],['🍽️','お皿[さら]'],['🥣','おわん']] },
  tools:     { name:'大工[だいく]道具[どうぐ]', fam:'thing', near:['kitchen','stationery'], items:[['🔨','かなづち'],['🪚','のこぎり'],['🔧','スパナ'],['🪛','ドライバー'],['🪜','はしご'],['🧰','道具箱[どうぐばこ]']] },
  body:      { name:'体[からだ]', fam:'body', near:[], items:[['👁️','目[め]'],['👂','耳[みみ]'],['👃','鼻[はな]'],['👄','口[くち]'],['✋','手[て]'],['🦶','足[あし]'],['🦷','歯[は]'],['👅','舌[した]'],['💪','うで']] },
  weather:   { name:'天気[てんき]', fam:'nature', near:[], items:[['☀️','晴[は]れ'],['☁️','くもり'],['☔','雨[あめ]'],['❄️','雪[ゆき]'],['⚡','かみなり'],['🌫️','きり'],['🌀','台風[たいふう]']] },
};
/* お題のとき「ちがう仲間」として出さない仲間（鳥や虫も動物なので、など） */
const NOT_WITH = { animal:['bird','insect','sea'], sea:['bird'], flower:['body'], clothes:['wear'], wear:['clothes'], dish:['sweets'] };
const NK = {
  easy:  { n:6, t:3, near:0, pics:true,  cats:['fruit','veg','dish','drink','sweets','animal','sea','flower','vehicle','building','clothes','body','instrument','weather'] },
  normal:{ n:8, t:4, near:2, pics:true,  cats:Object.keys(CATS) },
  hard:  { n:9, t:4, near:3, pics:false, cats:Object.keys(CATS) },
};

const APP = {
  id:'gg.nakama',
  levelDesc(lv) {
    return { easy:'絵[え]と ことば・6まいから 3つ', normal:'絵[え]と ことば・8まいから 4つ・にた 仲間[なかま]も まざる', hard:'ことばだけ・9まいから 4つ・にた 仲間[なかま]も まざる' }[lv];
  },
  make(lv) {
    const L0 = NK[lv], n = optN(L0.n, 4, 10);
    const t = Math.min(L0.t, n - 2), L = Object.assign({}, L0, { n, t, near: Math.min(L0.near, n - t) });   // 仲間（正答）は カードの数より2つ以上 少なく
    const mine = topicPool(Object.keys(CATS), k => k);
    return (mine ? fillTo(mine, SET_SIZE) : sample(L.cats, SET_SIZE)).map(c => {
      const C = CATS[c];
      const targets = sample(C.items, L.t);
      const skip = new Set([c].concat(NOT_WITH[c] || []));
      const usable = it => !(it[2] && it[2].includes(c));
      const near = [], far = [];
      for (const k of Object.keys(CATS)) {
        if (skip.has(k)) continue;
        const isNear = C.near.includes(k);
        if (lv === 'easy' && CATS[k].fam === C.fam) continue;      // 簡単はまったくちがう仲間だけ
        CATS[k].items.filter(usable).forEach(it => (isNear ? near : far).push(it));
      }
      const ds = sample(near, Math.min(L.near, near.length));
      /* 遠い仲間は、なるべくちがう仲間から1つずつ */
      const farByCat = shuffle(far);
      const seenCat = new Set();
      for (const it of farByCat) {
        if (ds.length >= L.n - L.t) break;
        const k = Object.keys(CATS).find(x => CATS[x].items.includes(it));
        if (seenCat.has(k) || ds.concat(targets).some(x => P(x[1]) === P(it[1]))) continue;
        seenCat.add(k); ds.push(it);
      }
      for (const it of farByCat) { if (ds.length >= L.n - L.t) break; if (!ds.includes(it) && !ds.concat(targets).some(x => P(x[1]) === P(it[1]))) ds.push(it); }
      const cards = shuffle(targets.map(it => ({ it, hit:true })).concat(ds.map(it => ({ it, hit:false }))));
      return { c, cards, pics: L.pics };
    });
  },
  instr() { return 'お題[だい]の 仲間[なかま]を ぜんぶ えらんで ください'; },
  render(q, lv, api) {
    const need = q.cards.filter(x => x.hit).length;
    let found = 0;
    $('stage').innerHTML = `<p class="cat-ask"><span class="cat-name">「${R(CATS[q.c].name)}」</span>の ${R('仲間[なかま]')}</p><p class="remain" id="remain"></p>`;
    const upd = () => { $('remain').innerHTML = found < need ? `あと <b>${need - found}</b> つ` : 'ぜんぶ みつけました'; };
    upd();
    const box = $('choices');
    box.dataset.n = q.cards.length;
    q.cards.forEach(cd => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ch card-pick' + (q.pics ? '' : ' words'); b._cd = cd;
      b.innerHTML = (q.pics ? `<span class="emo">${cd.it[0]}</span>` : '') + `<span class="lbl">${R(cd.it[1])}</span>`;
      b.addEventListener('click', () => {
        if (api.locked || b.disabled) return;
        if (cd.hit) { b.classList.add('ok'); b.disabled = true; found++; upd(); if (found >= need) api.solve(); }
        else api.miss(b);
      });
      box.appendChild(b);
    });
  },
  reveal() { document.querySelectorAll('#choices .ch').forEach(b => { if (b._cd.hit && !b.classList.contains('ok')) b.classList.add('reveal'); }); },
  answerText() { return '青[あお]い わくも 仲間[なかま]です'; },
  itemLabel(q) { return P(CATS[q.c].name); },
};

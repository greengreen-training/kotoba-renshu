/* セリフを えらびましょう：場面の絵と相手のセリフを見て、「あなた」の吹き出しに合うセリフを選ぶ
   プリント「セリフを考えましょう」1・2 の28場面＋新しい場面。
   場面は CADL などが扱う生活領域（受診・買い物・外食・電話・交通・対人のやりとり）を参考にしたオリジナル。
   mode：'reply'＝こたえる（相手のセリフあり）／'self'＝自分から 話す
   a：正答（相手に用件が伝わる言い方）　near：同じ場面で「伝わらない・ちがう」セリフ（難しい・普通で使う）
   fn：求められる伝達。fn の同じ仲間（GROUP）や同じ場所（place）の正答は「関係ないセリフ」に使わない
   ★場面を足すときは、near に「これでも伝わる」と言えるセリフを入れないこと */
const SCENES = [
  /* ---------- プリント1 ---------- */
  { t:'病院[びょういん]の 診察室[しんさつしつ]で', mode:'reply', place:'hospital', fn:'symptom', who:'doctor',
    s:'きのうから 頭[あたま]が 痛[いた]いです。病院[びょういん]に 来[き]ました。', line:'今日[きょう]は どう されましたか？', prop:{ sign:'診察室[しんさつしつ]' },
    a:'きのうから 頭[あたま]が 痛[いた]いんです。', near:['きのうから おなかが 痛[いた]いんです。','頭[あたま]は 痛[いた]く ありません。','薬局[やっきょく]は どこですか。'] },
  { t:'タクシーで', mode:'reply', place:'taxi', fn:'destination', who:'driver',
    s:'市役所[しやくしょ]へ 行[い]きたいです。タクシーに 乗[の]ります。', line:'どちらまで 行[い]きますか？', prop:{ emoji:'🚕' },
    a:'市役所[しやくしょ]まで お願[ねが]いします。', near:['駅[えき]まで お願[ねが]いします。','市役所[しやくしょ]から 来[き]ました。','タクシーを 呼[よ]んで ください。'] },
  { t:'食堂[しょくどう]で（注文[ちゅうもん]する）', mode:'reply', place:'restaurant', fn:'order', who:'staff',
    s:'お昼[ひる]ごはんを 食[た]べに 来[き]ました。メニューから 選[えら]んで 注文[ちゅうもん]しましょう。', line:'ご注文[ちゅうもん]は お決[き]まりですか？', prop:{ menu:['うどん','親子丼[おやこどん]','焼[や]き魚[ざかな]定食[ていしょく]'] },
    a:'うどんを ください。', near:['ラーメンを ください。','うどんは 好[す]きでは ありません。','ごちそうさまでした。'] },
  { t:'食堂[しょくどう]で（料理[りょうり]が 来[き]た）', mode:'self', place:'restaurant', fn:'complaint', who:'staff',
    s:'注文[ちゅうもん]した ものと ちがう カレーライスが 来[き]ました。店員[てんいん]さんに 伝[つた]えましょう。', line:'', prop:{ emoji:'🍛' },
    a:'すみません、これ、注文[ちゅうもん]と ちがいます。', near:['カレーを もう ひとつ ください。','とても おいしいです。','いただきます。'] },
  { t:'電話[でんわ]で', mode:'reply', place:'phone', fn:'invite', who:'phone',
    s:'友[とも]だちから 電話[でんわ]が かかって きました。', line:'あした、いっしょに 昼[ひる]ごはんを 食[た]べに 行[い]きませんか？', prop:null,
    a:'いいですね。何時[なんじ]に しますか。', near:['はい、ごはんを 食[た]べました。','電話[でんわ]番号[ばんごう]を 教[おし]えて ください。','おやすみなさい。'] },
  { t:'スーパーで', mode:'self', place:'store', fn:'location-q', who:'clerk',
    s:'牛乳[ぎゅうにゅう]を 買[か]いたいです。でも、売[う]り場[ば]が わかりません。店員[てんいん]さんに 聞[き]きましょう。', line:'', prop:{ emoji:'🥛', q:true },
    a:'すみません、牛乳[ぎゅうにゅう]は どこですか。', near:['すみません、パンは どこですか。','牛乳[ぎゅうにゅう]を 飲[の]みました。','いらっしゃいませ。'] },
  { t:'道[みち]で（道[みち]を 聞[き]く）', mode:'self', place:'street', fn:'direction-q', who:'passerby',
    s:'駅[えき]へ 行[い]きたいです。でも、道[みち]が わかりません。近[ちか]くの 人[ひと]に 聞[き]きましょう。', line:'', prop:{ emoji:'🚉', q:true },
    a:'すみません、駅[えき]は どう 行[い]けば いいですか。', near:['すみません、病院[びょういん]は どこですか。','駅[えき]から 来[き]ました。','気[き]を つけて ください。'] },
  { t:'道[みち]で（落[お]とし物[もの]）', mode:'self', place:'street', fn:'notify', who:'walker',
    s:'前[まえ]を 歩[ある]いて いる 人[ひと]が、財布[さいふ]を 落[お]としました。教[おし]えて あげましょう。', line:'', prop:{ emoji:'👛', note:'ポトッ' },
    a:'すみません、財布[さいふ]を 落[お]としましたよ。', near:['すみません、財布[さいふ]を なくしました。','その 財布[さいふ]、すてきですね。','こんにちは、いい 天気[てんき]ですね。'] },
  /* ---------- プリント2 ---------- */
  { t:'薬局[やっきょく]で（お薬[くすり]手帳[てちょう]）', mode:'reply', place:'pharmacy', fn:'forgot', who:'pharmacist',
    s:'薬局[やっきょく]に 来[き]ました。お薬[くすり]手帳[てちょう]を 家[いえ]に 忘[わす]れました。', line:'お薬[くすり]手帳[てちょう]は お持[も]ちですか？', prop:{ sign:'薬局[やっきょく]' },
    a:'すみません、家[いえ]に 忘[わす]れました。', near:['はい、これです。','お薬[くすり]を ください。','手帳[てちょう]を 買[か]いたいです。'] },
  { t:'薬局[やっきょく]で（薬[くすり]の 飲[の]み方[かた]）', mode:'self', place:'pharmacy', fn:'question', who:'pharmacist',
    s:'薬[くすり]を もらいました。でも、いつ 飲[の]むのか わかりません。薬剤師[やくざいし]さんに 聞[き]きましょう。', line:'', prop:{ emoji:'💊', q:true },
    a:'この 薬[くすり]は いつ 飲[の]みますか。', near:['この 薬[くすり]は いくらですか。','薬[くすり]を 飲[の]みました。','薬[くすり]は いりません。'] },
  { t:'駅[えき]で', mode:'self', place:'station', fn:'platform-q', who:'station',
    s:'空港[くうこう]へ 行[い]きたいです。でも、何番線[なんばんせん]か わかりません。駅員[えきいん]さんに 聞[き]きましょう。', line:'', prop:{ sign:'← 1番線[ばんせん]｜2番線[ばんせん] →', q:true },
    a:'すみません、空港[くうこう]へ 行[い]く 電車[でんしゃ]は 何番線[なんばんせん]ですか。', near:['すみません、空港[くうこう]から 来[き]ました。','2番線[ばんせん]は きれいですね。','切符[きっぷ]を なくしました。'] },
  { t:'電車[でんしゃ]の 中[なか]で', mode:'reply', place:'train', fn:'yes-seat', who:'young',
    s:'電車[でんしゃ]に 乗[の]って います。となりの 席[せき]は あいて います。', line:'すみません、ここ、あいて いますか？', prop:{ emoji:'💺' },
    a:'はい、あいて います。どうぞ。', near:['いいえ、あいて いません。','次[つぎ]の 駅[えき]で 降[お]ります。','どういたしまして。'] },
  { t:'郵便局[ゆうびんきょく]で（荷物[にもつ]）', mode:'reply', place:'post', fn:'purpose', who:'postclerk',
    s:'郵便局[ゆうびんきょく]に 来[き]ました。荷物[にもつ]を 送[おく]りたいです。', line:'いらっしゃいませ。ご用件[ようけん]は 何[なん]でしょうか？', prop:{ emoji:'📦' },
    a:'この 荷物[にもつ]を 送[おく]りたいです。', near:['荷物[にもつ]が 届[とど]きません。','切手[きって]を 1枚[まい] ください。','お金[かね]を おろしたいです。'] },
  { t:'郵便局[ゆうびんきょく]で（切手[きって]）', mode:'self', place:'post', fn:'buy', who:'postclerk',
    s:'はがきを 出[だ]したいです。でも、切手[きって]が ありません。切手[きって]を 買[か]いましょう。', line:'', prop:{ emoji:'✉️' },
    a:'はがきの 切手[きって]を 1枚[まい] ください。', near:['はがきを 1枚[まい] ください。','切手[きって]を 集[あつ]めて います。','この 荷物[にもつ]を 送[おく]りたいです。'] },
  { t:'洋服[ようふく]の 店[みせ]で（着[き]て みたい）', mode:'self', place:'clothes', fn:'permission', who:'clerk',
    s:'いい セーターが ありました。買[か]う 前[まえ]に 着[き]て みたいです。店員[てんいん]さんに 聞[き]きましょう。', line:'', prop:{ emoji:'🧶' },
    a:'これ、着[き]て みても いいですか。', near:['これ、いくらですか。','これを 洗[あら]って ください。','セーターは 持[も]って います。'] },
  { t:'洋服[ようふく]の 店[みせ]で（サイズ）', mode:'reply', place:'clothes', fn:'size', who:'clerk',
    s:'セーターを 着[き]て みました。少[すこ]し 小[ちい]さいです。', line:'サイズは いかがですか？', prop:{ emoji:'🧥' },
    a:'少[すこ]し 小[ちい]さいです。大[おお]きい サイズは ありますか。', near:['ちょうど いいです。','少[すこ]し 大[おお]きいです。','この 色[いろ]が 好[す]きです。'] },
  { t:'家[いえ]で（電話[でんわ]）', mode:'reply', place:'phone', fn:'wrong-number', who:'phone',
    s:'電話[でんわ]が かかって きました。でも、あなたは 田中[たなか]さんでは ありません。', line:'もしもし、田中[たなか]さんの お宅[たく]ですか？', prop:{ emoji:'🏠' },
    a:'いいえ、ちがいます。', near:['はい、田中[たなか]です。','田中[たなか]さんは 元気[げんき]です。','電話[でんわ]を ください。'] },
  { t:'家[いえ]で（お客[きゃく]さん）', mode:'reply', place:'home', fn:'thanks', who:'neighbor',
    s:'となりの 家[いえ]の 人[ひと]が、あなたの 家[いえ]に 来[き]ました。', line:'りんごを たくさん もらったので、よかったら どうぞ。', prop:{ emoji:'🍎' },
    a:'ありがとう ございます。いただきます。', near:['りんごを 売[う]って ください。','りんごは どこで 買[か]えますか。','いってらっしゃい。'] },
  { t:'デイサービスで（おやつ）', mode:'reply', place:'dayservice', fn:'choose', who:'caregiver',
    s:'おやつの 時間[じかん]です。職員[しょくいん]さんが 飲[の]み物[もの]を 聞[き]いて います。', line:'お茶[ちゃ]と コーヒー、どちらが いいですか？', prop:{ emoji:'🍵☕' },
    a:'お茶[ちゃ]を お願[ねが]いします。', near:['おやつは 3時[じ]です。','ごちそうさまでした。','体操[たいそう]を します。'] },
  { t:'デイサービスで（寒[さむ]い）', mode:'self', place:'dayservice', fn:'request-env', who:'caregiver',
    s:'エアコンの 風[かぜ]が 当[あ]たって、寒[さむ]いです。職員[しょくいん]さんに お願[ねが]い しましょう。', line:'', prop:{ emoji:'🥶', note:'ブルブル' },
    a:'すみません、寒[さむ]いので エアコンを 弱[よわ]く して ください。', near:['すみません、暑[あつ]いので エアコンを 強[つよ]く して ください。','エアコンは 新[あたら]しいですね。','窓[まど]を 開[あ]けて ください。'] },
  { t:'道[みち]で（友[とも]だちに 会[あ]う）', mode:'reply', place:'street', fn:'greeting-reply', who:'friend',
    s:'道[みち]で、久[ひさ]しぶりに 友[とも]だちに 会[あ]いました。', line:'お久[ひさ]しぶりです。お元気[げんき]でしたか？', prop:{ emoji:'🌳' },
    a:'お久[ひさ]しぶりです。おかげさまで 元気[げんき]です。', near:['はじめまして。','いってきます。','おやすみなさい。'] },
  { t:'待[ま]ち合[あ]わせで', mode:'self', place:'meet', fn:'apology', who:'friend',
    s:'10時[じ]に 会[あ]う 約束[やくそく]でした。でも、20分[ぷん] 遅[おく]れました。友[とも]だちが 待[ま]って います。', line:'', prop:{ clock:'10:20' },
    a:'遅[おそ]く なって ごめんなさい。', near:['早[はや]く 来[き]て ください。','いま 何時[なんじ]ですか。','また あした。'] },
  { t:'バス停[てい]で', mode:'self', place:'bus', fn:'confirm-bus', who:'busdriver',
    s:'市民[しみん]病院[びょういん]へ 行[い]きたいです。この バスで いいか、運転手[うんてんしゅ]さんに 聞[き]きましょう。', line:'', prop:{ emoji:'🚌', q:true },
    a:'この バスは 市民[しみん]病院[びょういん]に 行[い]きますか。', near:['この バスは 駅[えき]に 行[い]きますか。','市民[しみん]病院[びょういん]から 来[き]ました。','バスの 運転[うんてん]は たいへんですね。'] },
  { t:'バスの 中[なか]で', mode:'reply', place:'bus', fn:'thanks', who:'young',
    s:'バスに 乗[の]って います。若[わか]い 人[ひと]が 席[せき]を ゆずって くれました。', line:'どうぞ、ここに 座[すわ]って ください。', prop:{ emoji:'💺' },
    a:'ありがとう ございます。助[たす]かります。', near:['どうぞ、座[すわ]って ください。','すみません、席[せき]を ゆずって ください。','さようなら。'] },
  { t:'美容院[びよういん]に 電話[でんわ]', mode:'self', place:'salon', fn:'reservation', who:'phone',
    s:'美容院[びよういん]に 電話[でんわ]を かけました。あしたの 10時[じ]に 予約[よやく]を したいです。', line:'はい、みどり美容室[びようしつ]です。', prop:{ emoji:'✂️' },
    a:'あしたの 10時[じ]に 予約[よやく]を お願[ねが]いします。', near:['あさっての 3時[じ]に 予約[よやく]を お願[ねが]いします。','予約[よやく]を やめたいです。','髪[かみ]を 洗[あら]いました。'] },
  { t:'美容院[びよういん]で', mode:'reply', place:'salon', fn:'hair', who:'hairdresser',
    s:'美容院[びよういん]に 来[き]ました。髪[かみ]が のびたので、短[みじか]く 切[き]りたいです。', line:'今日[きょう]は どのように しますか？', prop:{ emoji:'✂️' },
    a:'短[みじか]く 切[き]って ください。', near:['長[なが]く のばして ください。','髪[かみ]を 染[そ]めて ください。','はさみを 貸[か]して ください。'] },
  { t:'交番[こうばん]で', mode:'reply', place:'police', fn:'lost', who:'police',
    s:'財布[さいふ]を なくして しまいました。交番[こうばん]に 来[き]ました。', line:'どう しましたか？', prop:{ sign:'交番[こうばん]' },
    a:'財布[さいふ]を なくしました。', near:['財布[さいふ]を 拾[ひろ]いました。','かぎを なくしました。','道[みち]を 教[おし]えて ください。'] },
  { t:'病院[びょういん]の 受付[うけつけ]で（次[つぎ]の 予約[よやく]）', mode:'reply', place:'hospital', fn:'date', who:'receptionist',
    s:'次[つぎ]の 予約[よやく]を します。カレンダーを 見[み]て、都合[つごう]の よい 日[ひ]を 伝[つた]えましょう。', line:'次[つぎ]の 予約[よやく]は いつが よろしいですか？', prop:{ calendar:true },
    a:'15日[にち]の 午前[ごぜん]が いいです。', near:['きのう 来[き]ました。','予約[よやく]は 10人[にん]です。','薬[くすり]を 飲[の]みました。'] },
  /* ---------- 新しい場面 ---------- */
  { t:'歯医者[はいしゃ]の 受付[うけつけ]で', mode:'reply', place:'dentist', fn:'yes-have', who:'receptionist',
    s:'歯医者[はいしゃ]に 来[き]ました。保険証[ほけんしょう]は 持[も]って きました。', line:'保険証[ほけんしょう]は お持[も]ちですか？', prop:{ emoji:'🦷' },
    a:'はい、これです。', near:['いいえ、持[も]って いません。','歯[は]を みがきました。','保険証[ほけんしょう]を 作[つく]りたいです。'] },
  { t:'コンビニの レジで', mode:'reply', place:'store', fn:'yes-request', who:'clerk',
    s:'コンビニで お弁当[べんとう]を 買[か]います。温[あたた]めて ほしいです。', line:'お弁当[べんとう]は 温[あたた]めますか？', prop:{ emoji:'🍱' },
    a:'はい、お願[ねが]いします。', near:['いいえ、けっこうです。','お弁当[べんとう]は どこですか。','いらっしゃいませ。'] },
  { t:'デイサービスの お迎[むか]え', mode:'reply', place:'dayservice', fn:'condition', who:'caregiver',
    s:'朝[あさ]、デイサービスの 車[くるま]が 迎[むか]えに 来[き]ました。今日[きょう]は 元気[げんき]です。', line:'おはようございます。体調[たいちょう]は いかがですか？', prop:{ emoji:'🚐' },
    a:'おはようございます。元気[げんき]です。', near:['おやすみなさい。','少[すこ]し 熱[ねつ]が あります。','お昼[ひる]ごはんは 何[なん]ですか。'] },
  { t:'レストランの 入[い]り口[ぐち]で', mode:'reply', place:'restaurant', fn:'number', who:'staff',
    s:'家族[かぞく]と 2人で レストランに 来[き]ました。', line:'いらっしゃいませ。何名様[なんめいさま]ですか？', prop:{ emoji:'🍽️' },
    a:'2人です。', near:['2時[じ]です。','3人です。','カレーを 2つ ください。'] },
  { t:'病院[びょういん]からの 電話[でんわ]', mode:'reply', place:'phone', fn:'confirm-yes', who:'phone',
    s:'病院[びょういん]から 電話[でんわ]です。あしたの 10時[じ]に 病院[びょういん]へ 行[い]く 予定[よてい]です。', line:'あしたの 予約[よやく]の 確認[かくにん]です。10時[じ]で よろしいですか？', prop:{ emoji:'🏥' },
    a:'はい、10時[じ]に 行[い]きます。', near:['はい、きのう 行[い]きました。','いいえ、田中[たなか]では ありません。','病院[びょういん]は 休[やす]みですか。'] },
  { t:'銀行[ぎんこう]の 窓口[まどぐち]で', mode:'reply', place:'bank', fn:'purpose', who:'bank',
    s:'銀行[ぎんこう]に 来[き]ました。お金[かね]を おろしたいです。', line:'本日[ほんじつ]は どのような ご用件[ようけん]ですか？', prop:{ sign:'銀行[ぎんこう]' },
    a:'お金[かね]を おろしたいです。', near:['お金[かね]を 預[あず]けたいです。','両替[りょうがえ]を お願[ねが]いします。','財布[さいふ]を 買[か]いたいです。'] },
  { t:'市役所[しやくしょ]の 窓口[まどぐち]で', mode:'reply', place:'office', fn:'purpose', who:'office',
    s:'市役所[しやくしょ]に 来[き]ました。住民票[じゅうみんひょう]が ほしいです。', line:'どのような ご用件[ようけん]ですか？', prop:{ sign:'市役所[しやくしょ]' },
    a:'住民票[じゅうみんひょう]を お願[ねが]いします。', near:['住所[じゅうしょ]は わかりません。','印鑑[いんかん]を なくしました。','バスの 時刻表[じこくひょう]を ください。'] },
  { t:'スーパーの レジで', mode:'reply', place:'store', fn:'no-have', who:'clerk',
    s:'スーパーで 買[か]い物[もの]を しました。ポイントカードは 持[も]って いません。', line:'ポイントカードは お持[も]ちですか？', prop:{ emoji:'🛒' },
    a:'いいえ、持[も]って いません。', near:['はい、これです。','ポイントは いくつですか。','袋[ふくろ]は どこですか。'] },
  { t:'デイサービスで（お昼[ひる]ごはん）', mode:'reply', place:'dayservice', fn:'amount', who:'caregiver',
    s:'お昼[ひる]ごはんの 時間[じかん]です。今日[きょう]は ごはんを 少[すく]なめに して ほしいです。', line:'ごはんの 量[りょう]は どう しますか？', prop:{ emoji:'🍚' },
    a:'少[すく]なめで お願[ねが]いします。', near:['大盛[おおも]りで お願[ねが]いします。','お茶[ちゃ]を ください。','ごちそうさまでした。'] },
  { t:'道[みち]で（道[みち]を 聞[き]かれる）', mode:'reply', place:'street', fn:'direction-give', who:'passerby',
    s:'道[みち]で 駅[えき]の 場所[ばしょ]を 聞[き]かれました。駅[えき]は まっすぐ 行[い]って 右[みぎ]です。', line:'すみません、駅[えき]は どちらですか？', prop:{ sign:'↑ まっすぐ → 駅[えき]' },
    a:'まっすぐ 行[い]って、右[みぎ]です。', near:['まっすぐ 行[い]って、左[ひだり]です。','駅[えき]で 待[ま]って います。','駅[えき]から 来[き]ました。'] },
  { t:'エレベーターで', mode:'reply', place:'elevator', fn:'floor', who:'young',
    s:'エレベーターに 乗[の]りました。3階[がい]に 行[い]きたいです。', line:'何階[なんがい]ですか？', prop:{ sign:'1　2　3　4' },
    a:'3階[がい]を お願[ねが]いします。', near:['5階[かい]を お願[ねが]いします。','3人です。','階段[かいだん]は どこですか。'] },
  { t:'レストランで（お水[みず]）', mode:'self', place:'restaurant', fn:'request-item', who:'staff',
    s:'食事[しょくじ]の とちゅうで、お水[みず]が ほしく なりました。店員[てんいん]さんに 頼[たの]みましょう。', line:'', prop:{ emoji:'🥤' },
    a:'すみません、お水[みず]を ください。', near:['すみません、お会計[かいけい]を お願[ねが]いします。','お水[みず]は 冷[つめ]たいですね。','いただきます。'] },
  { t:'レストランで（お会計[かいけい]）', mode:'self', place:'restaurant', fn:'pay', who:'staff',
    s:'食事[しょくじ]が 終[お]わりました。お金[かね]を 払[はら]いたいです。', line:'', prop:{ emoji:'🧾' },
    a:'すみません、お会計[かいけい]を お願[ねが]いします。', near:['すみません、メニューを ください。','おすすめは 何[なん]ですか。','お水[みず]を ください。'] },
  { t:'タクシーで（降[お]りる）', mode:'self', place:'taxi', fn:'stop', who:'driver',
    s:'タクシーに 乗[の]って います。家[いえ]の 前[まえ]に 着[つ]きました。止[と]まって ほしいです。', line:'', prop:{ emoji:'🏠' },
    a:'ここで 止[と]めて ください。', near:['もっと 速[はや]く 走[はし]って ください。','駅[えき]まで お願[ねが]いします。','ここは どこですか。'] },
  { t:'デイサービスで（トイレ）', mode:'self', place:'dayservice', fn:'toilet', who:'caregiver',
    s:'トイレに 行[い]きたく なりました。職員[しょくいん]さんに 伝[つた]えましょう。', line:'', prop:{ emoji:'🚻' },
    a:'すみません、トイレに 行[い]きたいです。', near:['すみません、お茶[ちゃ]を ください。','トイレは きれいですね。','もう 帰[かえ]ります。'] },
  { t:'家[いえ]の 前[まえ]で（あいさつ）', mode:'self', place:'home', fn:'greet-morning', who:'neighbor',
    s:'朝[あさ]、家[いえ]の 前[まえ]で となりの 人[ひと]に 会[あ]いました。あいさつ しましょう。', line:'', prop:{ emoji:'🌞' },
    a:'おはようございます。', near:['こんばんは。','おやすみなさい。','いただきます。'] },
  { t:'デイサービスに 電話[でんわ]（お休[やす]み）', mode:'self', place:'phone', fn:'absence', who:'phone',
    s:'熱[ねつ]が あるので、あしたの デイサービスを 休[やす]みたいです。電話[でんわ]を かけました。', line:'はい、グリーン・グリーンです。', prop:{ emoji:'🤒' },
    a:'あしたは 熱[ねつ]が あるので 休[やす]みます。', near:['あしたは 元気[げんき]なので 行[い]きます。','あしたは 何時[なんじ]に 来[き]ますか。','熱[ねつ]は ありません。'] },
  { t:'旅行先[りょこうさき]で（写真[しゃしん]）', mode:'self', place:'travel', fn:'request-photo', who:'passerby',
    s:'旅行先[りょこうさき]で、写真[しゃしん]を とって ほしいです。近[ちか]くの 人[ひと]に 頼[たの]みましょう。', line:'', prop:{ emoji:'📷' },
    a:'すみません、写真[しゃしん]を とって いただけますか。', near:['すみません、カメラを 買[か]いたいです。','写真[しゃしん]が 好[す]きです。','写真[しゃしん]を 見[み]せて ください。'] },
];
/* fn の仲間：同じ仲間の正答は、ほかの場面で「関係ないセリフ」として出さない（どちらにも合うことがあるため） */
const GROUP = { date:'time', reservation:'time', 'confirm-yes':'yes', floor:'time', 'yes-seat':'yes', 'yes-have':'yes', 'yes-request':'yes',
  'no-have':'no', 'wrong-number':'no', 'greeting-reply':'greet', 'greet-morning':'greet', condition:'greet' };
const grp = sc => GROUP[sc.fn] || sc.fn;
/* さらに、たがいに「関係ないセリフ」として出さない組み合わせ（どちらにも答えになりうるもの） */
const CONFLICTS = [['invite','yes','time','no'], ['choose','yes','request-item'], ['amount','yes'], ['condition','symptom','absence'], ['lost','symptom'],
  ['destination','direction-give','stop'], ['date','yes'], ['reservation','yes'], ['forgot','no']];
const clash = (g1, g2) => g1 === g2 || CONFLICTS.some(c => c.includes(g1) && c.includes(g2));

/* ---------- 場面の絵 ---------- */
const ROLES = {   // 相手の見た目
  doctor:{ top:'#ffffff', coat:true, steth:true, hair:'#3a3a3a' }, pharmacist:{ top:'#ffffff', coat:true, hair:'#5a4636' },
  driver:{ top:'#3d4f74', hat:'#2f3f60', hair:'#3a3a3a' }, busdriver:{ top:'#3d4f74', hat:'#2f3f60', hair:'#3a3a3a' },
  staff:{ top:'#ffffff', apron:'#4f6292', hair:'#2e2e2e' }, clerk:{ top:'#ffffff', apron:'#3f8f5a', hair:'#4b3a2c' },
  station:{ top:'#2f4370', hat:'#2f4370', hair:'#2e2e2e' }, passerby:{ top:'#6c8fbf', hair:'#3a3a3a' }, walker:{ top:'#7a6aa8', hair:'#3a3a3a', back:true },
  young:{ top:'#f0b26e', hair:'#2e2e2e' }, postclerk:{ top:'#c94c4c', hair:'#2e2e2e' }, neighbor:{ top:'#8dbf7a', hair:'#8c8c8c', long:true },
  caregiver:{ top:'#5fa883', hair:'#3a2e25', badge:true }, friend:{ top:'#e8a16a', hair:'#9a9a9a', long:true },
  hairdresser:{ top:'#2f2f2f', hair:'#7a4a2a', long:true }, police:{ top:'#2c4a86', hat:'#203868', hair:'#2e2e2e' },
  receptionist:{ top:'#b9a3d6', hair:'#3a2e25', long:true }, bank:{ top:'#3f5470', hair:'#3a3a3a' }, office:{ top:'#5d7aa3', hair:'#3a3a3a' },
};
function personSVG(o, x, you) {
  const skin = '#f6d3b5', top = o.top || '#999', hair = o.hair || '#333';
  let g = `<g transform="translate(${x},0)">`;
  g += `<path d="M-46 170 Q-46 112 0 108 Q46 112 46 170 Z" fill="${top}" stroke="#3b3b3b" stroke-width="2.5"/>`;
  if (o.coat) g += `<path d="M-12 112 L0 140 L12 112" fill="none" stroke="#9aa5b1" stroke-width="2.5"/>`;
  if (o.apron) g += `<path d="M-26 128 h52 v42 h-52 z" fill="${o.apron}" stroke="#3b3b3b" stroke-width="2"/>`;
  if (o.steth) g += `<path d="M-14 112 q-6 26 8 34 q14 -8 8 -34" fill="none" stroke="#4a5866" stroke-width="3"/><circle cx="1" cy="147" r="4.5" fill="#cfd6de" stroke="#4a5866" stroke-width="2"/>`;
  if (o.badge) g += `<rect x="12" y="128" width="16" height="10" rx="2" fill="#fff" stroke="#3b3b3b" stroke-width="1.5"/>`;
  g += `<rect x="-7" y="92" width="14" height="18" fill="${skin}" stroke="#3b3b3b" stroke-width="2"/>`;
  if (o.back) {   // うしろすがた
    g += `<circle cx="0" cy="70" r="28" fill="${hair}" stroke="#3b3b3b" stroke-width="2.5"/>`;
  } else {
    if (o.long) g += `<path d="M-30 74 Q-32 38 0 36 Q32 38 30 74 L30 96 L-30 96 Z" fill="${hair}" stroke="#3b3b3b" stroke-width="2.5"/>`;
    g += `<circle cx="0" cy="70" r="27" fill="${skin}" stroke="#3b3b3b" stroke-width="2.5"/>`;
    g += o.long ? `<path d="M-28 66 Q-26 38 0 38 Q26 38 28 66 Q14 50 0 52 Q-14 50 -28 66 Z" fill="${hair}"/>`
                : `<path d="M-28 64 Q-28 40 0 40 Q28 40 28 64 Q20 52 0 52 Q-20 52 -28 64 Z" fill="${hair}"/>`;
    g += `<circle cx="-9" cy="72" r="2.6" fill="#333"/><circle cx="9" cy="72" r="2.6" fill="#333"/><path d="M-7 84 q7 5 14 0" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>`;
    if (you) g += `<circle cx="-17" cy="80" r="4" fill="#f4a9a9" opacity=".7"/><circle cx="17" cy="80" r="4" fill="#f4a9a9" opacity=".7"/>`;
    if (o.hat) g += `<path d="M-27 52 Q-26 32 0 32 Q26 32 27 52 Z" fill="${o.hat}" stroke="#3b3b3b" stroke-width="2"/><rect x="-30" y="50" width="60" height="6" rx="3" fill="${o.hat}" stroke="#3b3b3b" stroke-width="2"/>`;
  }
  if (you) g += `<rect x="-26" y="140" width="52" height="20" rx="10" fill="#fff" stroke="#3b3b3b" stroke-width="2"/><text x="0" y="155" text-anchor="middle" font-size="13" font-weight="700" fill="#333">あなた</text>`;
  return g + '</g>';
}
const YOU = { f:{ top:'#f3b4c6', hair:'#b9b9b9', long:true }, m:{ top:'#8fb3d9', hair:'#a9a9a9' } };
function phoneSVG(x) {
  return `<g transform="translate(${x},0)"><circle cx="0" cy="110" r="52" fill="#eef3ea" stroke="#3b3b3b" stroke-width="2.5"/><text x="0" y="128" text-anchor="middle" font-size="54">📞</text></g>`;
}
function propHTML(p) {
  if (!p) return '';
  let h = '';
  if (p.emoji) h += `<span class="p-emo emo">${p.emoji}</span>`;
  if (p.sign) h += `<span class="p-sign">${R(p.sign)}</span>`;
  if (p.menu) h += `<span class="p-menu"><b>おしながき</b>${p.menu.map(m => `<span>${R(m)}</span>`).join('')}</span>`;
  if (p.clock) h += `<span class="p-sign p-clock"><span class="emo">🕙</span> ${p.clock}</span>`;
  if (p.calendar) h += `<span class="p-cal"><b>${R('来月[らいげつ]の カレンダー')}</b><span class="cal">${['日','月','火','水','木','金','土'].map(d => `<i>${d}</i>`).join('')}${Array.from({ length: 30 }, (_, i) => `<i>${i + 1}</i>`).join('')}</span></span>`;
  if (p.note) h += `<span class="p-note">${p.note}</span>`;
  if (p.q) h += `<span class="p-q">？</span>`;
  return `<div class="prop">${h}</div>`;
}
function sceneHTML(sc) {
  const me = curMe();
  const left = sc.who === 'phone' ? phoneSVG(80) : personSVG(ROLES[sc.who] || {}, 80, false);
  return `<div class="sc-head"><span class="sc-title">${R(sc.t)}</span><span class="sc-tag ${sc.mode}">${sc.mode === 'reply' ? 'こたえる' : R('自分[じぶん]から 話[はな]す')}</span>
      <button class="speak" id="speakBtn" type="button" aria-label="読み上げる"><span class="emo">🔊</span> <ruby>聞<rt>き</rt></ruby>く</button></div>
    <p class="sc-sit">${R(sc.s)}</p>
    <div class="scene">
      <div class="bubbles">
        <div class="bub bub-l${sc.line ? '' : ' none'}"><span class="bub-t">${sc.line ? R(sc.line) : ''}</span></div>
        <div class="bub bub-r" id="myBub"><span class="q">？</span></div>
      </div>
      <div class="people">
        <svg viewBox="0 0 400 172" preserveAspectRatio="xMidYMax meet" aria-hidden="true">${left}${personSVG(YOU[me], 320, true)}</svg>
        ${propHTML(sc.prop)}
      </div>
    </div>`;
}

/* あなたの絵（女性／男性）：その人ごとに覚えておく */
const ME_KEY = () => 'gg.serifu.me' + ((typeof window.GG_USER === 'string' && window.GG_USER) ? '.' + window.GG_USER : '');
function curMe() { try { return localStorage.getItem(ME_KEY()) === 'm' ? 'm' : 'f'; } catch (e) { return 'f'; } }
function paintMePick() {
  const v = curMe();
  document.querySelectorAll('.me-pick button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.me === v)));
}
document.addEventListener('click', e => {
  const b = e.target.closest('.me-pick button');
  if (!b) return;
  try { localStorage.setItem(ME_KEY(), b.dataset.me); } catch (err) {}
  paintMePick();
});
setTimeout(paintMePick, 0);

function speakJa(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'ja-JP'; u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

const SL = { easy:{ n:3, near:0, modes:['reply'] }, normal:{ n:3, near:1, modes:['reply','self'] }, hard:{ n:4, near:3, modes:['reply','self'] } };

const APP = {
  id:'gg.serifu',
  levelDesc(lv) { return { easy:'相手[あいて]に こたえる 場面[ばめん]・3択', normal:'自分[じぶん]から 話[はな]す 場面[ばめん]も・3択', hard:'自分[じぶん]から 話[はな]す 場面[ばめん]も・4択・にた セリフが まざる' }[lv]; },
  make(lv) {
    const L = SL[lv], n = optN(L.n, 2, 5);
    const pool = topicPool(SCENES, sc => P(sc.t)) || SCENES.filter(sc => L.modes.includes(sc.mode));
    return sample(pool, SET_SIZE).map(sc => {
      const near = sample(sc.near, Math.min(L.near, n - 1));
      const far = sample(SCENES.filter(o => o !== sc && !clash(grp(o), grp(sc)) && o.place !== sc.place && !near.includes(o.a)).map(o => o.a), n - 1 - near.length);
      return Object.assign({}, sc, { opts: shuffle([sc.a].concat(near, far)) });
    });
  },
  instr() { return '「あなた」の 吹[ふ]き出[だ]しに 入[はい]る セリフを えらんで ください'; },
  render(q) {
    $('stage').innerHTML = sceneHTML(q);
    $('speakBtn').addEventListener('click', () => speakJa(P(q.s) + '　' + (q.line ? P(q.line) : '')));
    choiceButtons(q.opts, o => R(o), o => o === q.a, o => { const b = $('myBub'); b.innerHTML = '<span class="bub-t">' + R(o) + '</span>'; b.classList.add('filled'); });
    $('choices').classList.add('lines');
  },
  reveal(q) { const b = $('myBub'); b.innerHTML = '<span class="bub-t">' + R(q.a) + '</span>'; b.classList.add('filled', 'reveal'); revealChoice(o => o === q.a); },
  answerText(q) { return `こたえの 例[れい]：「${q.a}」`; },
  itemLabel(q) { return P(q.t); },
  onQuit() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) {} },
};

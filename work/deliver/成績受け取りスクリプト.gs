/**
 * グリーン・グリーン ことばの練習：成績・録音の受け取りと、個人別メニュー（Google Apps Script）
 *
 * ・利用者のスマホから届いた成績を、このスプレッドシートの「記録」シートに1行ずつ書きます。
 * ・同じ記録が2回届いても、1行しか書きません（記録IDで見分けます）。
 * ・成績一覧ページは、下のパスワードを付けて読みに来たときだけ、記録を返します。
 * ・個人別メニュー：成績一覧ページで決めた「その人がやる練習と難しさ」を「メニュー」シートに書き、
 *   利用者のアプリが開いたときに読みに来ます（決めるのはパスワードが必要、読むのは利用者番号だけ）。
 * ・このスクリプトは、この先 アプリや成績一覧ページに新しい設定が増えても、貼り直さなくて よいように 作ってあります
 *   （知らない設定も、決まった形のものなら そのまま保存して返します）。
 * ・宿題：個人別メニューには、お題・回数・期限も付けられます。利用者のアプリが読みに来たとき、
 *   メニューを決めた日から何回やったかも「記録」シートから数えて返します。
 * ・録音：成績一覧ページで「声も送る」にした人だけ、録音の練習の声が届きます。
 *   この Google アカウントのドライブの「ことばの練習 録音」フォルダ（利用者番号ごと）に保存し、「録音」シートに1行ずつ書きます。
 *
 * ★ 最初に下の STAFF_PASSWORD を、職員だけが知っている言葉に変えてください。
 *   （成績一覧ページの「設定」で同じものを入れます）
 */
const STAFF_PASSWORD = 'ここを職員用のパスワードに変える';

const SHEET_NAME = '記録';
const HEAD = ['受信日時', '練習した日時', '利用者番号', '練習', 'しゅるい', '難しさ', '点数', '満点', '〇△×', '問題ごと', 'かかった秒数', '記録ID', '練習ID', 'その他（アプリが使います）'];
const MENU_SHEET = 'メニュー';
const MENU_HEAD = ['利用者番号', '練習メニュー（成績一覧ページで変えます）', '変えた日時', '声を送る（成績一覧ページで変えます）', '宿題の期限（成績一覧ページで変えます）', 'その他の設定（成績一覧ページで変えます）'];
const LVJP = { easy: '簡単', normal: '普通', hard: '難しい' };
const AUDIO_SHEET = '録音';
const AUDIO_HEAD = ['受信日時', '録音した日時', '利用者番号', '練習', '内容', '秒数', 'ファイル名', 'ファイルID', '記録ID'];
const AUDIO_FOLDER = 'ことばの練習 録音';
const MAX_AUDIO = 15 * 1024 * 1024;

function headed_(name, head) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(head);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, head.length).setFontWeight('bold').setBackground('#e5f0dc');
  }
  return sh;
}
/* 前のスクリプトで作ったシートには、あとから足した列の見出しを足す */
function addHeads_(sh, head) {
  const now = sh.getRange(1, 1, 1, head.length).getValues()[0];
  now.forEach((v, c) => {
    if (v === '') sh.getRange(1, c + 1).setValue(head[c]).setFontWeight('bold').setBackground('#e5f0dc');
  });
  return sh;
}
function sheet_() { return addHeads_(headed_(SHEET_NAME, HEAD), HEAD); }
function audioSheet_() { return headed_(AUDIO_SHEET, AUDIO_HEAD); }
function menuSheet_() {
  const sh = headed_(MENU_SHEET, MENU_HEAD);
  sh.getRange('A:A').setNumberFormat('@');
  sh.getRange('E:E').setNumberFormat('@');
  return addHeads_(sh, MENU_HEAD);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
const okUser_ = u => /^[A-Za-z0-9_-]{1,20}$/.test(String(u || ''));
/* パスワードを書きかえ忘れたとき（「ここを…」のまま）は受け付けない。置きかえでこの行が変わらないよう、最初の3文字だけで見る */
const okKey_ = k => k === STAFF_PASSWORD && String(STAFF_PASSWORD).indexOf('ここを') !== 0;
const iso_ = v => (v instanceof Date ? v.toISOString() : v);

/* 文字の長さをそろえ、表計算の式として読まれないようにする */
function text_(v, n) {
  let s = String(v == null ? '' : v).slice(0, n);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

/* ---------- 個人別メニュー・宿題・声を送るか ---------- */
/* お題：練習の中の問題の名前（例「魚」「家で」）。回数：宿題として やる回数（0＝決めない） */
function cleanTopics_(a) {
  if (!Array.isArray(a)) return [];
  const out = [];
  a.slice(0, 60).forEach(t => {
    const s = String(t == null ? '' : t).replace(/[\u0000-\u001f<>"\\]/g, '').trim().slice(0, 40);
    if (s && out.indexOf(s) < 0) out.push(s);
  });
  return out;
}
/* ---------- この先 増える設定のための「その他」 ----------
   英字の名前（16文字まで）と、数・はい／いいえ・短い文字・短い一覧だけを そのまま通して保存する。
   アプリや成績一覧ページに新しい設定を足しても、このスクリプトを貼り直さなくて すむように するため。 */
const cleanStr_ = (v, n) => String(v).replace(/[\u0000-\u001f<>"\\]/g, '').slice(0, n);
function cleanVal_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return cleanStr_(v, 80);
  if (Array.isArray(v)) return v.slice(0, 60).map(x => (typeof x === 'number' && isFinite(x)) ? x : typeof x === 'string' ? cleanStr_(x, 40) : null).filter(x => x !== null);
  return undefined;
}
function cleanExtra_(o) {
  const out = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return out;
  Object.keys(o).slice(0, 30).forEach(k => {
    if (!/^[a-z][A-Za-z0-9]{0,15}$/.test(k)) return;
    const v = cleanVal_(o[k]);
    if (v !== undefined) out[k] = v;
  });
  return JSON.stringify(out).length <= 3000 ? out : {};
}
const parseExtra_ = v => { try { return cleanExtra_(JSON.parse(String(v || '{}'))); } catch (e) { return {}; } };
const ITEM_KEYS = ['app', 'lv', 'type', 'topics', 'times', 'n', 'opts'];
function cleanItems_(a) {
  if (!Array.isArray(a)) return [];
  return a.slice(0, 40).map(x => {
    /* 知っている設定は ここで くわしく確かめる。知らない設定は「その他」と同じ ルールで そのまま通す */
    const ex = cleanExtra_(x);
    ITEM_KEYS.forEach(k => { delete ex[k]; });
    const it = Object.assign({ app: String((x && x.app) || ''), lv: String((x && x.lv) || ''), type: String((x && x.type) || '') }, ex);
    it.app = String((x && x.app) || ''); it.lv = String((x && x.lv) || ''); it.type = String((x && x.type) || '');
    const topics = cleanTopics_(x && x.topics), times = Math.max(0, Math.min(30, Math.floor(Number(x && x.times) || 0)));
    if (topics.length) it.topics = topics;
    if (times) it.times = times;
    /* 人ごとの 問題数（1〜30）・選択肢の数（0〜12。並べ替えの「まぜる字」は0もある） */
    const n = Math.floor(Number(x && x.n)), o = x && x.opts !== '' && x.opts != null ? Math.floor(Number(x.opts)) : NaN;
    if (n >= 1 && n <= 30) it.n = n;
    if (o >= 0 && o <= 12) it.opts = o;
    return it;
  }).filter(x => /^[a-z0-9]{1,20}$/.test(x.app) && /^(easy|normal|hard|)$/.test(x.lv) && /^[A-Za-z0-9_-]{0,20}$/.test(x.type));
}
const cleanDue_ = v => {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
};
const yes_ = v => v === true || /^(はい|TRUE|1)$/i.test(String(v || ''));
function readMenus_() {
  const sh = menuSheet_(), last = sh.getLastRow(), out = {};
  if (last < 2) return out;
  sh.getRange(2, 1, last - 1, 6).getValues().forEach(r => {
    const id = String(r[0]);
    if (!okUser_(id)) return;
    let items = [];
    try { items = cleanItems_(JSON.parse(String(r[1] || '[]'))); } catch (e) {}
    out[id] = { items: items, at: r[2] instanceof Date ? r[2].toISOString() : String(r[2] || ''), voice: yes_(r[3]), due: cleanDue_(r[4]), extra: parseExtra_(r[5]) };
  });
  return out;
}
function menuRow_(sh, user) {
  const last = sh.getLastRow();
  const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
  const i = ids.indexOf(user);
  if (i >= 0) return i + 2;
  sh.getRange(last + 1, 1, 1, 3).setValues([[user, '[]', new Date()]]);
  return last + 1;
}
function saveMenu_(user, items, due, extra) {
  const sh = menuSheet_(), row = menuRow_(sh, user);
  sh.getRange(row, 1, 1, 3).setValues([[user, JSON.stringify(items), new Date()]]);
  sh.getRange(row, 5).setValue(due || '');
  if (extra) sh.getRange(row, 6).setValue(Object.keys(extra).length ? JSON.stringify(extra) : '');
}
/* その人の「その他の設定」だけを変える（メニューを決めた日時は変えない） */
function saveExtra_(user, extra) {
  const sh = menuSheet_(), row = menuRow_(sh, user);
  sh.getRange(row, 6).setValue(Object.keys(extra).length ? JSON.stringify(extra) : '');
}
/* メニューを決めた日時から、その人が それぞれの練習を何回やったか（「記録」シートの 練習ID で数える）。
   同じ練習を ちがう難しさで2つ出しているときだけ、難しさも見る */
function doneCounts_(user, m) {
  const items = m.items || [];
  if (!items.length) return [];
  const since = new Date(m.at || 0).getTime() || 0;
  const sh = sheet_(), last = sh.getLastRow();
  const counts = items.map(() => 0);
  if (last < 2) return counts;
  const vals = sh.getRange(2, 1, last - 1, HEAD.length).getValues();
  const dup = {};
  items.forEach(it => { dup[it.app] = (dup[it.app] || 0) + 1; });
  vals.forEach(r => {
    if (String(r[2]) !== user) return;
    const when = r[1] instanceof Date ? r[1].getTime() : new Date(r[1]).getTime();
    if (!(when >= since)) return;
    const app = String(r[12] || ''), lvName = String(r[5] || '');
    items.forEach((it, i) => {
      if (it.app !== app) return;
      if (dup[app] > 1 && it.lv && lvName.indexOf(LVJP[it.lv]) < 0) return;
      counts[i]++;
    });
  });
  return counts;
}
function saveVoice_(user, voice) {
  const sh = menuSheet_(), row = menuRow_(sh, user);
  sh.getRange(row, 4).setValue(voice ? 'はい' : '');
}

/* ---------- 録音のフォルダ ---------- */
function folder_(create) {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('AUDIO_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  if (!create) return null;
  const f = DriveApp.createFolder(AUDIO_FOLDER);
  props.setProperty('AUDIO_FOLDER_ID', f.getId());
  return f;
}
function userFolder_(user) {
  const root = folder_(true), it = root.getFoldersByName(user);
  return it.hasNext() ? it.next() : root.createFolder(user);
}
const EXT = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/aac': 'aac', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a', 'audio/3gpp': '3gp', 'video/mp4': 'mp4', 'video/webm': 'webm' };
function saveAudio_(body) {
  const user = String(body.user || ''), uid = String(body.uid || '').slice(0, 40);
  if (!okUser_(user) || !uid) return { ok: false, error: 'user', uid: uid };
  const m = readMenus_()[user];
  if (!m || !m.voice) return { ok: false, error: 'novoice', uid: uid };          // 「声も送る」になっていない人の声は受け取らない
  const sh = audioSheet_(), last = sh.getLastRow();
  const known = last > 1 ? sh.getRange(2, 9, last - 1, 1).getValues().map(r => String(r[0])) : [];
  if (known.indexOf(uid) >= 0) return { ok: true, uid: uid, dup: true };            // もう受け取った録音
  const mime = EXT[String(body.mime || '')] ? String(body.mime) : 'audio/webm';
  let bytes;
  try { bytes = Utilities.base64Decode(String(body.data || '')); } catch (e) { return { ok: false, error: 'size', uid: uid }; }
  if (!bytes.length || bytes.length > MAX_AUDIO) return { ok: false, error: 'size', uid: uid };
  let when = new Date(body.ts);
  if (isNaN(when.getTime())) when = new Date();
  const label = String(body.label || '').replace(/[\\/:*?"<>|\r\n]/g, '').slice(0, 40);
  const name = user + '_' + Utilities.formatDate(when, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '_' + text_(body.appName, 30).replace(/[\\/:*?"<>|]/g, '') + (label ? '_' + label : '') + '.' + EXT[mime];
  const file = userFolder_(user).createFile(Utilities.newBlob(bytes, mime, name));
  sh.appendRow([new Date(), when, user, text_(body.appName, 40), text_(body.label, 80), Number(body.dur) || 0, name, file.getId(), uid]);
  return { ok: true, uid: uid };
}

/* 利用者のスマホから成績・録音が届いたとき／成績一覧ページから個人別メニューが届いたとき */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (body.action === 'audio') return out_(saveAudio_(body));

    if (body.action === 'setmenu' || body.action === 'setvoice' || body.action === 'setextra') {
      if (!okKey_(body.key)) return out_({ ok: false, error: 'password' });
      if (!okUser_(body.user)) return out_({ ok: false, error: 'user' });
      const user = String(body.user);
      if (body.action === 'setvoice') { saveVoice_(user, !!body.voice); return out_({ ok: true, user: user, voice: !!body.voice }); }
      if (body.action === 'setextra') { const ex = cleanExtra_(body.extra); saveExtra_(user, ex); return out_({ ok: true, user: user, extra: ex }); }
      const items = cleanItems_(body.items), due = items.length ? cleanDue_(body.due) : '';
      const extra = body.extra !== undefined ? cleanExtra_(body.extra) : null;
      saveMenu_(user, items, due, extra);
      return out_({ ok: true, user: user, items: items, due: due, homework: true, extra: extra || undefined });
    }

    const recs = Array.isArray(body.records) ? body.records.slice(0, 100) : [];
    const sh = sheet_();
    const last = sh.getLastRow();
    const known = new Set(last > 1 ? sh.getRange(2, 12, last - 1, 1).getValues().map(r => String(r[0])) : []);
    const rows = [], saved = [];
    recs.forEach(r => {
      const uid = String(r.uid || '').slice(0, 40);
      const user = String(r.user || '');
      if (!uid || !okUser_(user)) return;
      saved.push(uid);
      if (known.has(uid)) return;          // もう書いてある記録
      known.add(uid);
      let when = new Date(r.ts);
      if (isNaN(when.getTime())) when = new Date();
      rows.push([new Date(), when, user, text_(r.appName, 40), text_(r.typeName, 40), text_(r.levelName, 60),
        Number(r.score) || 0, Number(r.max) || 0, text_(r.marks, 60), text_(r.items, 2000), Number(r.sec) || 0, uid,
        /^[a-z0-9]{1,20}$/.test(String(r.app || '')) ? String(r.app) : '',
        (ex => Object.keys(ex).length ? JSON.stringify(ex) : '')(cleanExtra_(r.extra))]);
    });
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, HEAD.length).setValues(rows);
    return out_({ ok: true, saved: saved });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

/* 読みに来たとき
   ・…?menu=利用者番号        ：その人の個人別メニュー・宿題の期限・やった回数と「声を送るか」を返す
                                 （利用者のアプリが使う。パスワードはいらない。点数は返さない）
   ・…?key=パスワード          ：成績・録音の一覧・全員の個人別メニューを返す（成績一覧ページが使う）
   ・…?key=パスワード&audio=ID ：録音1つを返す（成績一覧ページで聞くとき） */
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.menu != null) {
    if (!okUser_(p.menu)) return out_({ ok: false, error: 'user' });
    const user = String(p.menu);
    const m = readMenus_()[user] || { items: [], at: '', voice: false, due: '', extra: {} };
    const hw = m.items.some(it => it.times) || !!m.due;
    return out_({ ok: true, menu: true, user: user, items: m.items, at: m.at, voice: m.voice, due: m.due || '', extra: m.extra || {},
      done: hw ? doneCounts_(user, m) : [], v: 3 });
  }
  if (!okKey_(p.key)) return out_({ ok: false, error: 'password' });
  const ash = audioSheet_(), alast = ash.getLastRow();
  const arows = alast > 1 ? ash.getRange(2, 1, alast - 1, AUDIO_HEAD.length).getValues() : [];
  if (p.audio != null) {
    const row = arows.find(r => String(r[7]) === String(p.audio));          // 「録音」シートにあるファイルだけ
    if (!row) return out_({ ok: false, error: 'notfound' });
    const blob = DriveApp.getFileById(String(p.audio)).getBlob();
    return out_({ ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) });
  }
  const sh = sheet_(), last = sh.getLastRow();
  const rows = last > 1 ? sh.getRange(2, 1, last - 1, HEAD.length).getValues() : [];
  const f = folder_(false);
  return out_({ ok: true, head: HEAD, rows: rows.map(r => r.map(iso_)), menus: readMenus_(),
    audio: arows.map(r => r.map(iso_)), audioFolder: f ? f.getUrl() : '' });
}

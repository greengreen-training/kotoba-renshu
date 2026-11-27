/* 受け取りスクリプト（.gs）を、Google のしくみの「にせもの」の上で動かすテスト用サーバー。
   POST / GET を doPost / doGet に渡す。シートは メモリの中だけ。 */
const fs = require('fs'), http = require('http'), vm = require('vm');
const GAS = process.argv[2], PORT = Number(process.argv[3] || 8799), PASSWORD = process.argv[4] || 'testpass';

function makeSheet(name) {
  const data = [];   // data[r][c]（0 始まり）
  const sh = {
    name,
    getLastRow: () => { for (let r = data.length - 1; r >= 0; r--) if (data[r] && data[r].some(v => v !== '' && v != null)) return r + 1; return 0; },
    appendRow: row => { data[sh.getLastRow()] = row.slice(); },
    setFrozenRows: () => sh,
    getRange(a, b, c, d) {
      if (typeof a === 'string') return chain({});
      const r0 = a - 1, c0 = b - 1, nr = c || 1, nc = d || 1;
      return chain({
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => { const v = (data[r0 + i] || [])[c0 + j]; return v == null ? '' : v; })),
        getValue: () => { const v = (data[r0] || [])[c0]; return v == null ? '' : v; },
        setValues: vals => { vals.forEach((row, i) => { data[r0 + i] = data[r0 + i] || []; row.forEach((v, j) => { data[r0 + i][c0 + j] = v; }); }); return this; },
        setValue: v => { data[r0] = data[r0] || []; data[r0][c0] = v; },
      });
    },
    _data: data,
  };
  return sh;
}
function chain(o) {
  const p = new Proxy(o, { get: (t, k) => (k in t ? t[k] : () => p) });
  return p;
}
const sheets = {};
const ctx = {
  console, Date, JSON, Math, Number, String, Array, Object, Set, RegExp, isNaN, parseInt, Error,
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet(n)) }) },
  ContentService: { createTextOutput: t => ({ setMimeType: () => ({ text: t }) }), MimeType: { JSON: 'json' } },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Tokyo' },
  Utilities: {
    formatDate: (d, tz, f) => { const j = new Date(d.getTime() + 9 * 3600e3), z = n => String(n).padStart(2, '0');
      return f.replace('yyyy', j.getUTCFullYear()).replace('MM', z(j.getUTCMonth() + 1)).replace('dd', z(j.getUTCDate())).replace('HH', z(j.getUTCHours())).replace('mm', z(j.getUTCMinutes())).replace('ss', z(j.getUTCSeconds())); },
    base64Decode: s => Buffer.from(s, 'base64'), base64Encode: b => Buffer.from(b).toString('base64'), newBlob: () => ({}),
  },
  DriveApp: { getFolderById: () => { throw new Error('no'); }, createFolder: () => ({ getId: () => 'f', getUrl: () => 'u', getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({ createFile: () => ({ getId: () => 'file' }) }) }) },
};
vm.createContext(ctx);
const src = fs.readFileSync(GAS, 'utf8').replace("const STAFF_PASSWORD = 'ここを職員用のパスワードに変える';", `const STAFF_PASSWORD = '${PASSWORD}';`);
vm.runInContext(src + '\n;globalThis.__doGet = doGet; globalThis.__doPost = doPost;', ctx);

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  const send = out => { res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(out.text); };
  if (u.pathname === '/__sheets') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(Object.fromEntries(Object.entries(sheets).map(([k, v]) => [k, v._data])))); return; }
  if (req.method === 'POST') {
    let body = ''; req.on('data', c => { body += c; }); req.on('end', () => send(ctx.__doPost({ postData: { contents: body } })));
  } else send(ctx.__doGet({ parameter: Object.fromEntries(u.searchParams) }));
}).listen(PORT, () => console.log('gas ready ' + PORT));

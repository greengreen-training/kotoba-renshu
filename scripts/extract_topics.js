const fs = require('fs'), vm = require('vm');
const path = require('path');
const TMP = require('os').tmpdir() + path.sep;
const ROOT = process.env.KR_ROOT || path.resolve(__dirname, '..');
process.chdir(path.join(ROOT, 'newapps'));
const P = s => String(s).replace(/\[[ぁ-ゖー]+\]/g, '');
function grab(file, names, pre) {
  let src = fs.readFileSync(file, 'utf8');
  const ctx = { console };
  vm.createContext(ctx);
  vm.runInContext((pre || '') + '\n' + src + '\n;globalThis.__out = {' + names.map(n => n + ': (typeof ' + n + ' !== "undefined" ? ' + n + ' : null)').join(',') + '};', ctx);
  return ctx.__out;
}
// serifu: only the data part (before const SL)
function cut(src, start) { const i0 = src.indexOf(start); let i = i0 + start.length - 1, d = 0, j = i; const open = src[i], close = open === '[' ? ']' : '}';
  for (; j < src.length; j++) { if (src[j] === open) d++; else if (src[j] === close) { d--; if (!d) break; } } return src.slice(i0, j + 1) + ';'; }
const sj = fs.readFileSync('apps/serifu.js', 'utf8');
fs.writeFileSync(TMP + '_serifu_data.js', sj.slice(0, sj.indexOf('const SCENES')) .replace(/[\s\S]*/, '') + cut(sj, 'const SCENES = ['));
const ser = grab(TMP + '_serifu_data.js', ['SCENES']);
const bun = grab('apps/bun_topics.js', ['TOPICS']);
let nk = fs.readFileSync('apps/nakama.js', 'utf8'); nk = nk.slice(0, nk.indexOf('const NOT_WITH')); fs.writeFileSync(TMP + '_nk.js', nk);
const nak = grab(TMP + '_nk.js', ['CATS']);
const g = fs.readFileSync('standalone/goso.html', 'utf8');
const gs = g.slice(g.indexOf('const CATS = {'), g.indexOf('const TYPES')); fs.writeFileSync(TMP + '_goso.js', gs);
const goso = grab(TMP + '_goso.js', ['CATS', 'ONSETS']);
const r = fs.readFileSync('standalone/gojuonrec.html', 'utf8');
const rs = r.slice(r.indexOf('const ROWS = ['), r.indexOf('];', r.indexOf('const ROWS = [')) + 2); fs.writeFileSync(TMP + '_rows.js', rs);
const rows = grab(TMP + '_rows.js', ['ROWS']);
const a = fs.readFileSync(path.join(ROOT, 'src', 'aisatsu.html'), 'utf8');
const i0 = a.indexOf('const STAGES = ['); let depth = 0, i = a.indexOf('[', i0), j = i;
for (; j < a.length; j++) { if (a[j] === '[') depth++; else if (a[j] === ']') { depth--; if (!depth) break; } }
fs.writeFileSync(TMP + '_ais.js', 'const STAGES = ' + a.slice(i, j + 1) + ';');
const ais = grab(TMP + '_ais.js', ['STAGES']);
const PLACE = { hospital:'病院', taxi:'タクシー', restaurant:'食堂・お店', phone:'電話', store:'買い物', street:'道', bank:'銀行・役所', home:'家', bus:'バス・電車', station:'駅', post:'郵便局', pharmacy:'薬局', hotel:'ホテル' };
const sceneGroups = ['reply', 'self'].map(m => ({ name: m === 'reply' ? 'こたえる 場面' : '自分から 話す 場面', items: ser.SCENES.filter(x => x.mode === m).map(x => [P(x.t), P(x.t)]) }));
const out = {
  serifu: { groups: sceneGroups },
  serifu2: { groups: sceneGroups },
  bun: { groups: [['place', '場所から'], ['time', '時間から'], ['thing', '人・ことから']].map(([t, n]) => ({ name: n, items: bun.TOPICS.filter(x => x.t === t).map(x => [P(x.k), P(x.k)]) })) },
  nakama: { groups: [{ name: '仲間', items: Object.keys(nak.CATS).map(k => [k, P(nak.CATS[k].name)]) }] },
  goso: { byType: true, groups: [
    ...['easy', 'normal', 'hard'].map((lv, n) => ({ type: 'cat', name: 'カテゴリ：' + ['簡単', '普通', '難しい'][n] + 'で 出る お題', items: goso.CATS[lv].map(c => ['cat:' + P(c[0]), P(c[0])]) })),
    ...['easy', 'normal', 'hard'].map((lv, n) => ({ type: 'onset', name: '語頭音：' + ['簡単', '普通', '難しい'][n] + 'で 出る 音', items: goso.ONSETS[lv].map(k => ['onset:' + k, k]) })) ] },
  gojuonrec: { groups: [{ name: '清音', items: rows.ROWS.filter(x => !x.daku).map(x => [x.id, x.name]) }, { name: '濁音・半濁音', items: rows.ROWS.filter(x => x.daku).map(x => [x.id, x.name]) }] },
  aisatsu: { groups: [{ name: '場面', items: ais.STAGES.map(x => [x.id, x.title]) }] },
};
// uniqueness check
for (const k in out) { const keys = out[k].groups.flatMap(g => g.items.map(x => x[0])); const dup = keys.filter((x, i) => keys.indexOf(x) !== i); if (dup.length) { console.error('DUP', k, dup); process.exit(1); } }
process.stdout.write(JSON.stringify(out));

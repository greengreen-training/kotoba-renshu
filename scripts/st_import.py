"""ことばの練習の成績ファイル（成績一覧の［ST経過記録へ渡すファイル］）を、
ST経過記録（claude.ai の Artifact）の「おうちの課題」（homeResults コレクション）の形に直す。

  python3 -I scripts/st_import.py <成績ファイル.json> <ST経過記録の patients フォルダ> <出力フォルダ> [<すでにある homeResults フォルダ>]

- 利用者は「利用者番号 ＝ グリーン・グリーンの名簿番号（patients の ggId）」で結ぶ（松本さんの決め、2026-11-28）。
- 1回の記録を1つの文書にする。文書の名前は kr-<記録の番号>。すでにある名前は書かない（二重に入れない）。
- 出力フォルダに 文書ごとの JSON と、まとめ（summary.json）を作る。読みこみは Claude が ArtifactData の batch で行う（50件ずつ）。
- 名前は 成績ファイルにも 出力にも 入れない。このスクリプトにも 個人のデータを 書かない。
"""
import glob, hashlib, json, os, re, sys
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
MARK = {"〇": 1, "△": 0.5, "×": 0}
SAFE = re.compile(r"[^A-Za-z0-9_\-.~:@+]")


def parse_item(t):
    m = re.match(r"^(.*?)([〇△×])(?:（(.*)）)?$", t)
    if not m:
        return {"q": t}
    ex = m.group(3) or ""
    out = {"q": m.group(1), "r": MARK[m.group(2)]}
    sec = re.search(r"([\d.]+)秒", ex)
    if sec:
        out["sec"] = float(sec.group(1))
    w = re.search(r"えらんだ：(.+)$", ex)
    if w:
        picks = []
        for p in [x.strip() for x in w.group(1).split("、") if x.strip()]:
            s = re.match(r"^(.+?)（(順番ちがい・)?(?:(\d+)文字目は|正しくは) (.+?)）$", p)
            picks.append(s.group(1) if s else p)
            if s and "a" not in out and not s.group(3):
                out["a"] = s.group(4)          # 50音ならべ：正しい字
        out["picks"] = picks
    if "時間切れ" in ex:
        out["late"] = True
    return out


def load_docs(folder):
    docs = {}
    for f in glob.glob(os.path.join(folder, "*.json")):
        d = json.load(open(f, encoding="utf-8"))
        if isinstance(d, dict) and isinstance(d.get("data"), dict):
            d = d["data"]
        docs[os.path.basename(f)[:-5]] = d
    return docs


def main():
    src, pat_dir, out_dir = sys.argv[1:4]
    have = set(load_docs(sys.argv[4]).keys()) if len(sys.argv) > 4 and os.path.isdir(sys.argv[4]) else set()
    data = json.load(open(src, encoding="utf-8"))
    if data.get("kind") != "kotoba-renshu-records":
        sys.exit("ことばの練習の［ST経過記録へ渡すファイル］ではありません")
    by_gg = {}
    for pid, p in load_docs(pat_dir).items():
        if p.get("ggId") is not None:
            by_gg.setdefault(str(p["ggId"]), []).append(pid)
    os.makedirs(out_dir, exist_ok=True)
    made, skipped, unmatched, twice = [], 0, {}, {}
    for r in data.get("records", []):
        user = str(r.get("user", "")).strip()
        key = str(int(user)) if user.isdigit() else user
        pids = by_gg.get(key, [])
        if len(pids) != 1:
            (unmatched if not pids else twice)[user] = (unmatched if not pids else twice).get(user, 0) + 1
            continue
        uid = str(r.get("uid") or "")
        base = uid or hashlib.sha1("|".join(str(r.get(k, "")) for k in ("user", "at", "app", "items")).encode()).hexdigest()[:20]
        doc_id = ("kr-" + SAFE.sub("_", base))[:200]
        if doc_id in made:   # 記録IDは ふつう 重ならないが、重なったときは 中身で 名前を分ける
            doc_id = (doc_id + "-" + hashlib.sha1("|".join(str(r.get(k, "")) for k in ("at", "app", "items")).encode()).hexdigest()[:8])[:200]
        if doc_id in have:
            skipped += 1
            continue
        at = datetime.fromisoformat(str(r["at"]).replace("Z", "+00:00")).astimezone(JST)
        items = [parse_item(x) for x in str(r.get("items") or "").split("／") if x]
        doc = {
            "patientId": pids[0], "ggId": int(key) if key.isdigit() else key, "source": "ことばの練習",
            "app": r.get("app") or r.get("appId") or "", "appId": r.get("appId") or "",
            "level": "・".join(x for x in (r.get("type"), r.get("level")) if x) or "",
            "date": at.strftime("%Y-%m-%d"), "t": int(at.timestamp() * 1000),
            # 録音だけの練習（満点 0）は 点数なし（ST経過記録では「—」と出る）
            "score": (r.get("score") or 0) if r.get("max") else None, "max": r.get("max") or None, "durSec": r.get("sec") or 0,
            "marks": r.get("marks") or "", "items": [x for x in items if x.get("q")],
            "importedAt": datetime.now(JST).isoformat(timespec="seconds"),
        }
        json.dump(doc, open(os.path.join(out_dir, doc_id + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
        made.append(doc_id)
    summary = {"made": len(made), "skipped_existing": skipped, "unmatched_users": unmatched, "ambiguous_users": twice, "ids": made}
    json.dump(summary, open(os.path.join(out_dir, "summary.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(f"新しく入れる {len(made)}件・すでにある {skipped}件・結べない番号 {unmatched or 'なし'}・名簿番号が重なる {twice or 'なし'}")


main()

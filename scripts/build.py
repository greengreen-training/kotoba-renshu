import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
import re, sys
SRC = f"{ROOT}/src"
WORK = f"{ROOT}/work"
logo = open(f"{ROOT}/assets/logo_b64.txt").read().strip()
tpl = open(f"{WORK}/template.html").read()
order = ["eawase", "onin", "oto2", "gojuon", "gojuonrec", "narabe", "narabe2", "nakama", "fusen", "setsumei", "goso", "meishi", "joshi", "doushi", "doushi2", "bun", "serifu", "serifu2", "aisatsu"]
labels = {"eawase":"絵合わせ","onin":"音を選ぶ練習（音韻選択課題）","gojuon":"50音ならべ","narabe":"ことば並べ替え（初級）","narabe2":"ことば並べ替え（上級）","nakama":"仲間えらび（カテゴリ）","fusen":"風船ことば","setsumei":"説明ことば","meishi":"名詞の練習（2語文）","joshi":"助詞の練習","doushi":"動詞の練習（動詞選択課題）","serifu":"セリフをえらびましょう","oto2":"音を選ぶ練習（上級）","gojuonrec":"五十音れんしゅう（録音）","serifu2":"セリフをいいましょう（録音）","aisatsu":"挨拶語のトレーニング（録音）","bun":"文をつくろう（いつ・どこで・なにを／録音）","goso":"語想起タイムアタック（60秒・録音）","doushi2":"動詞の練習（上級）"}
FILE = {"onin":"oto"}
blocks = []
for k in order:
    h = open(f"{SRC}/gg/{FILE.get(k, k)}.html").read()
    e = re.sub(r"</script", "<\\\\/script", h, flags=re.I).replace("<!--", "<\\!--")
    assert "</script" not in e.lower() and "<!--" not in e
    blocks.append(f'<script type="text/plain" data-app="{k}">{e}</script><!-- /{k}：{labels[k]} -->')
out = tpl.replace("@@LOGO@@", logo).replace("@@APP_SOURCES@@", "\n".join(blocks))
# 宿題のお題の一覧（各練習のデータから取り出す。成績一覧ページと同じもの）
import subprocess, json
topics = subprocess.run(["node", f"{ROOT}/scripts/extract_topics.js"], check=True, capture_output=True, text=True).stdout
json.loads(topics)
assert out.count("/*@@TOPICS@@*/{}") == 1
out = out.replace("/*@@TOPICS@@*/{}", topics.replace("</", "<\\/"))
open(f"{WORK}/グリーン・グリーン_ことばの練習.html", "w").write(out)
print(len(out.encode()))

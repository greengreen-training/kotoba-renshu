import os as _os
ROOT = _os.environ.get("KR_ROOT") or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
import html, os
W=f"{ROOT}/work"
tpl=open(f"{W}/seiseki_template.html",encoding="utf-8").read()
logo=open(f"{ROOT}/assets/logo_b64.txt").read().strip()
qr=open(f"{ROOT}/vendor/qrcode/qrcode.js",encoding="utf-8").read()
assert "</script" not in qr.lower()
gas=open(f"{W}/deliver/成績受け取りスクリプト.gs",encoding="utf-8").read()
import subprocess, json
topics=subprocess.run(["node",f"{ROOT}/scripts/extract_topics.js"],check=True,capture_output=True,text=True).stdout
json.loads(topics)
assert tpl.count("/*@@TOPICS@@*/{}")==1
tpl=tpl.replace("/*@@TOPICS@@*/{}",topics.replace("</","<\\/"))
out=tpl.replace("@@LOGO@@",logo).replace("@@QRLIB@@",qr).replace("@@GAS_CODE@@",html.escape(gas, quote=False))
os.makedirs(f"{W}/deliver/netlify",exist_ok=True)
open(f"{W}/deliver/netlify/seiseki.html","w",encoding="utf-8").write(out)
import shutil; shutil.copy(f"{W}/グリーン・グリーン_ことばの練習.html", f"{W}/deliver/netlify/index.html")
print(len(out.encode()))
# 挨拶語トレーニングの絵（index.html と同じ場所の images フォルダ。hana_e1 は使わない）
os.makedirs(f"{W}/deliver/netlify/images", exist_ok=True)
for f in sorted(os.listdir(f"{ROOT}/src/aisatsu_images")):
    if f.endswith(".webp") and f != "hana_e1.webp":
        shutil.copy(f"{ROOT}/src/aisatsu_images/{f}", f"{W}/deliver/netlify/images/{f}")
print("images", len(os.listdir(f"{W}/deliver/netlify/images")))

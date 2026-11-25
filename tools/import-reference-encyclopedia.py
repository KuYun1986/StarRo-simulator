#!/usr/bin/env python3
"""Snapshot matched factual item metadata from the user-supplied public reference.

Does not copy third-party HTML, JS, images, or long item-description prose.
Only IDs, type, factual equipment specifications, attributed source names,
and public icon URLs are kept. Ambiguous name matches are skipped.
"""
import json
import re
import pathlib
import urllib.parse
import urllib.request
from collections import defaultdict

ROOT=pathlib.Path(__file__).resolve().parent.parent
URL="https://ro-collectitem-yuno.netlify.app/"
RAW=(ROOT/"collection-data.js").read_text(encoding="utf-8")
marker="const ITEMS="
start=RAW.index(marker)+len(marker)
COLLECTIONS,_=json.JSONDecoder().raw_decode(RAW[start:])

def norm(v):
    v=str(v or "").strip()
    v=re.sub(r"^\s*\+\d+\s*","",v)
    v=re.sub(r"\s*[×xX*]\s*\d+(?:\.\d+)?\s*$","",v)
    return re.sub(r"\s+","",v).replace("（","(").replace("）",")").casefold()

required={str(name).strip() for row in COLLECTIONS for name in row.get("required",[]) if name}
request=urllib.request.Request(URL,headers={"User-Agent":"StarRo-ReferenceMetadata/1.0"})
with urllib.request.urlopen(request,timeout=40) as response:
    raw=response.read(16000000).decode("utf-8","replace")
match=re.search(r'<script[^>]*id=["\x27]encyclopedia-data["\x27][^>]*>(.*?)</script>',raw,re.S|re.I)
if not match:
    raise RuntimeError("Public reference encyclopedia JSON not found; previous snapshot remains unchanged")
reference=json.loads(match.group(1))
database=reference.get("items",{})
if not isinstance(database,dict) or len(database)<100:
    raise RuntimeError("Reference item schema invalid")

by_name=defaultdict(list)
for item_id,obj in database.items():
    if not isinstance(obj,dict) or not obj.get("name"):
        continue
    for rawname in [obj.get("name"),obj.get("alias")]:
        key=norm(rawname)
        if key and obj not in by_name[key]:
            by_name[key].append((str(item_id),obj))

def metadata(item_id,item):
    icon=str(item.get("icon") or "")
    image=urllib.parse.urljoin(URL,icon) if re.fullmatch(r"item-icons/[0-9]+\.(?:png|webp)",icon) else ""
    kind=str(item.get("kind") or "").strip()[:40]
    equipment=[]
    # Keep only independently factual numerical specs, not descriptive gameplay prose.
    desc=str(item.get("description") or "")
    for field in ["系列","攻擊","防禦","重量","武器等級","要求等級","裝備"]:
        found=re.search(re.escape(field)+r"\s*[:：]\s*([^\n\r]+)",desc)
        if found:
            equipment.append(field+"："+found.group(1).strip()[:45])
    sources=[]
    for g in item.get("gacha_sources") or []:
        if not isinstance(g,dict):continue
        egg=str(g.get("egg") or "").strip()
        if not egg:continue
        tier=str(g.get("tier") or "").strip()
        number=str(g.get("box_id") or "").strip()
        label="轉蛋："+egg+(("（"+tier+"）") if tier else "")
        if number:label+="｜編號 "+number
        if label not in sources:sources.append(label)
    result={"itemId":str(item_id),"type":kind,"image":image,"referenceUrl":URL}
    if equipment:result["stats"]="；".join(equipment)[:400]
    if sources:result["sources"]=sources[:35]
    return result

result={}
ambiguous=0
for name in sorted(required):
    matches=by_name.get(norm(name),[])
    # Distinct item IDs sharing a display name are unsafe to map automatically.
    unique={i:o for i,o in matches}
    if len(unique)!=1:
        ambiguous+=len(unique)>1
        continue
    item_id,item=next(iter(unique.items()))
    result[name]=metadata(item_id,item)
# Produce deterministic, compact JavaScript data, not external images.
serialized=json.dumps(result,ensure_ascii=False,separators=(",",":"),sort_keys=True)
output="/* Factual matching names and IDs from "+URL+"; image URLs are remote references, not copied assets. */\n"
output+="window.StarroReferenceItems="+serialized+";\n"
(ROOT/"reference-items.js").write_text(output,encoding="utf-8")
print(json.dumps({"reference_items":len(database),"requirements":len(required),
 "matched":len(result),"ambiguous":ambiguous,"bytes":len(output.encode("utf-8")),
 "sources":sum(bool(x.get("sources")) for x in result.values()),
 "icons":sum(bool(x.get("image")) for x in result.values())},ensure_ascii=False))
if len(result)<30:
    raise RuntimeError("Too few precise matches; review reference names before publishing")

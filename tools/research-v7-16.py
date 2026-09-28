#!/usr/bin/env python3
"""V7.16 research pass: offline candidate matching for the 69 unresolved geography cases.
Research only: never writes production pins. Uses public OSM Lazio extract + local ISTAT
municipality geometry. No live geocoder, no device location, no municipal centroids.
"""
from pathlib import Path
import csv,json,re,unicodedata,math,hashlib,requests,os
from collections import defaultdict,Counter
import osmium
from shapely.geometry import shape,Point,LineString,Polygon

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get("RESEARCH_OUT","/tmp/v716-research"));OUT.mkdir(parents=True,exist_ok=True)
DATE="2026-09-28"
QUEUE=ROOT/"downloads/Coda_Geografia_V7_11_7.csv"
rows=list(csv.DictReader(QUEUE.open(encoding="utf-8-sig"),delimiter=";"))
assert len(rows)==69, len(rows)

def norm(s):
    return re.sub(r"[^a-z0-9]+"," ",unicodedata.normalize("NFKD",str(s).replace("’","'")).encode("ascii","ignore").decode().lower()).strip()
def street_text(a):
    s=norm(a)
    s=re.sub(r"\b(km|snc)\b.*$","",s)
    s=re.split(r"\b\d",s)[0].strip()
    return s
def street_key(s):
    s=norm(s)
    return " ".join(re.sub(r"\b(via|viale|piazza|piazzale|corso|largo|vicolo|strada|localita|loc|contrada|ss|sp|dei|degli|delle|della|dell|del|di|da|la|il|lo)\b"," ",s).split())
def civic(a):
    if re.search(r"\bkm\b",a,re.I): return ""
    m=re.search(r"(?:,\s*|\s+)(\d+)\s*(?:/\s*([a-zA-Z])|\b([a-zA-Z])\b)?",a)
    return (m.group(1)+(m.group(2) or m.group(3) or "")).lower() if m else ""
generic=set("dsm csm serd spdc centro diurno ambulatorio punto sede direzione riferimento organizzativo comunita terapeutica residenza riabilitativo riabilitativa struttura servizio servizi srsr h24 h12".split())
def name_tokens(s):
    return [x for x in norm(s).split() if len(x)>=4 and x not in generic]

# Local ISTAT municipality polygons.
municipal={}
for code in ["vt","ri","rm","lt","fr"]:
    d=json.loads((ROOT/f"data/comuni_{code}_istat2026_v7_14.geojson").read_text())
    for f in d["features"]:
        municipal[norm(f["properties"]["name"])]=shape(f["geometry"])
index=json.loads((ROOT/"data/comuni_province_istat2026_v7_13.json").read_text())
for alias,v in index.get("aliases",{}).items():
    canonical=norm(v.get("municipality",""))
    if canonical in municipal: municipal[norm(alias)]=municipal[canonical]

target_streets={street_key(street_text(r["indirizzo"])) for r in rows if street_key(street_text(r["indirizzo"]))}
target_names=set()
for r in rows:
    toks=name_tokens(r["denominazione"])
    if toks: target_names.add(" ".join(toks))

URL="https://download.openstreetmap.fr/extracts/europe/italy/lazio-latest.osm.pbf"
pbf=OUT/"lazio.osm.pbf"
if not pbf.exists():
    S=requests.Session();S.headers["User-Agent"]="LazioServiceAudit/7.16 (offline documentary geography research)"
    with S.get(URL,timeout=(20,240),stream=True) as rr:
        rr.raise_for_status()
        h=hashlib.sha256()
        with pbf.open("wb") as f:
            for chunk in rr.iter_content(1024*1024):
                if chunk:f.write(chunk);h.update(chunk)
        meta={"url":URL,"retrieved_at":DATE,"bytes":pbf.stat().st_size,"sha256":h.hexdigest(),"last_modified":rr.headers.get("Last-Modified"),"license":"ODbL-1.0","attribution":"OpenStreetMap contributors"}
        (OUT/"osm-manifest.json").write_text(json.dumps(meta,indent=2)+"\n")

features=[]
def relevant(tags):
    n=street_key(tags.get("addr:street","") or tags.get("name",""))
    if n and n in target_streets:return True
    nt=" ".join(name_tokens(tags.get("name","")))
    if nt and (nt in target_names or any(len(set(nt.split())&set(t.split()))>=2 for t in target_names)):return True
    return False
class H(osmium.SimpleHandler):
    def node(self,n):
        t=dict(n.tags)
        if not n.location.valid() or not relevant(t):return
        features.append({"osm_type":"node","osm_id":n.id,"tags":t,"lat":n.location.lat,"lng":n.location.lon,"kind":"node"})
    def way(self,w):
        t=dict(w.tags)
        if not relevant(t):return
        try:
            pts=[(x.lon,x.lat) for x in w.nodes]
            if len(pts)<2:return
            closed=len(pts)>3 and pts[0]==pts[-1]
            g=Polygon(pts) if closed else LineString(pts)
            if g.is_empty:return
            p=g.representative_point() if closed else g.interpolate(.5,normalized=True)
            features.append({"osm_type":"way","osm_id":w.id,"tags":t,"lat":p.y,"lng":p.x,"kind":"building" if t.get("building") else "road" if t.get("highway") else "site","bounds":list(g.bounds),"geometry_type":g.geom_type,"length_deg":g.length})
        except Exception:pass
H().apply_file(str(pbf),locations=True)
(OUT/"matched-osm-features.json").write_text(json.dumps(features,ensure_ascii=False,indent=2)+"\n")

by_street=defaultdict(list)
for f in features:
    k=street_key(f["tags"].get("addr:street","") or (f["tags"].get("name","") if f["kind"]=="road" else ""))
    if k:by_street[k].append(f)

def span_km(fs):
    if not fs:return 999
    xs=[];ys=[]
    for f in fs:
        b=f.get("bounds",[f["lng"],f["lat"],f["lng"],f["lat"]]);xs.extend([b[0],b[2]]);ys.extend([b[1],b[3]])
    return math.hypot((max(xs)-min(xs))*83,(max(ys)-min(ys))*111)

results=[]
for r in rows:
    poly=municipal.get(norm(r["comune"]))
    sk=street_key(street_text(r["indirizzo"]));cv=civic(r["indirizzo"])
    inside=lambda f: poly is not None and poly.buffer(.0002).covers(Point(f["lng"],f["lat"]))
    streetfs=[f for f in by_street.get(sk,[]) if inside(f)]
    exact=[f for f in streetfs if cv and norm(f["tags"].get("addr:housenumber","")).replace(" ","")==cv]
    toks=set(name_tokens(r["denominazione"]))
    named=[]
    if toks and poly is not None:
        for f in features:
            if not inside(f):continue
            ft=set(name_tokens(f["tags"].get("name","")))
            if len(toks&ft)>=2 or (len(toks)>=1 and toks==ft):named.append(f)
    candidates=[]
    if exact:
        candidates.append({"kind":"exact_civic","count":len(exact),"features":[{"lat":f["lat"],"lng":f["lng"],"osm":f"https://www.openstreetmap.org/{f['osm_type']}/{f['osm_id']}","name":f["tags"].get("name"),"housenumber":f["tags"].get("addr:housenumber"),"street":f["tags"].get("addr:street")} for f in exact[:8]]})
    if named:
        candidates.append({"kind":"named_feature","count":len(named),"features":[{"lat":f["lat"],"lng":f["lng"],"osm":f"https://www.openstreetmap.org/{f['osm_type']}/{f['osm_id']}","name":f["tags"].get("name"),"street":f["tags"].get("addr:street"),"housenumber":f["tags"].get("addr:housenumber")} for f in named[:8]]})
    roads=[f for f in streetfs if f["kind"]=="road"]
    extent=span_km(roads)
    if roads and extent<=2.5:
        f=max(roads,key=lambda x:x.get("length_deg",0))
        candidates.append({"kind":"bounded_street","extent_km":round(extent,3),"features":[{"lat":f["lat"],"lng":f["lng"],"osm":f"https://www.openstreetmap.org/{f['osm_type']}/{f['osm_id']}","name":f["tags"].get("name")}]})
    status="candidate_review" if candidates else "manual_research_required"
    results.append({"service_key":r["service_key"],"name":r["denominazione"],"town":r["comune"],"address":r["indirizzo"],"previous_note":r["nota"],"sources":[x.strip() for x in r["fonti"].split("|") if x.strip()],"status":status,"candidates":candidates,"street_extent_km":None if not roads else round(extent,3)})

summary={"version":"7.16-research","checked_at":DATE,"queue":len(results),"candidate_records":sum(x["status"]=="candidate_review" for x in results),"manual_records":sum(x["status"]!="candidate_review" for x in results),"candidate_types":dict(Counter(c["kind"] for x in results for c in x["candidates"])),"automatic_promotions":0}
(OUT/"candidate-review.json").write_text(json.dumps({"summary":summary,"records":results},ensure_ascii=False,indent=2)+"\n")
lines=["# V7.16 geography research — candidates only","No production pin has been added automatically.","",json.dumps(summary,ensure_ascii=False),""]
for x in results:
    kinds=", ".join(c["kind"] for c in x["candidates"]) or "MANUAL_RESEARCH_REQUIRED"
    lines.append(f"{x['service_key']} | {x['name']} | {x['town']} | {x['address']} | {kinds}")
(OUT/"candidate-summary.txt").write_text("\n".join(lines)+"\n")
print(json.dumps(summary,ensure_ascii=False,indent=2))

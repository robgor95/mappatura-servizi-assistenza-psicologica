#!/usr/bin/env python3
"""Non-invasive public-only WordPress staging smoke check.
No cookies, credentials, user content or patient data are sent or collected.
Designed to run in CI without privilege on the AlterVista site.
"""
import json
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

BASE = "https://mappamenta.altervista.org"
TIMEOUT=12
CHECKS = [
  ("/", "html", ("salute mentale",)),
  ("/servizi.html", "html", ("svc-form", "servizi")),
  ("/mappa.html", "html", ("mappa",)),
  ("/orientati.html", "html", ("menta",)),
  ("/assets/servizi-v7-18.js", "asset", ("LazioServices",)),
  ("/data/editorial-catalog-v7-18.json", "catalog", ()),
  ("/api/public/revisions", "revisions", ()),
  ("/api/public/content", "content", ()),
  ("/wp-json/sml/v1/revisions", "revisions", ()),
  ("/wp-json/sml/v1/content", "content", ()),
  ("/wp-json/", "wpjson", ()),
  ("/robots.txt", "robots", ()),
  ("/sitemap.xml", "sitemap", ()),
]
results = []
for path,kind,tokens in CHECKS:
  url = BASE+path
  req = urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; SML-staging-smoke/0.1; +https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)","Accept":"*/*","Cache-Control":"no-cache"})
  try:
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:
      status=r.status
      final_url=r.url
      headers={k.lower():v for k,v in r.headers.items()}
      body=r.read(2_500_000)
  except urllib.error.HTTPError as e:
    status=e.code;final_url=e.url;headers={k.lower():v for k,v in e.headers.items()}
    body=e.read(5000)
  except Exception as e:
    results.append({"path":path,"status":"unreachable","result":"UNKNOWN","reason":type(e).__name__})
    continue
  txt=body.decode("utf-8","replace")
  errors=[]
  if kind=="sitemap":
    # Must not be available as an indexable production sitemap.
    if status==200 and "noindex" not in headers.get("x-robots-tag","").lower():
      errors.append("sitemap indexability must be reviewed")
  elif status!=200:
    errors.append("unexpected HTTP status")
  if kind=="html" and status==200:
    if not all(t in txt.lower() for t in tokens):errors.append("expected page markers missing")
    if "noindex" not in headers.get("x-robots-tag","").lower() and not ("name=\"robots\"" in txt.lower() and "noindex" in txt.lower()):
      errors.append("noindex not present (staging risk)")
    if "https://mappatura-servizi-assistenza-psicologica.pages.dev" in txt.lower():
      errors.append("old production origin in HTML (review)")
  elif kind=="robots" and status==200 and "disallow: /" not in txt.lower():
    errors.append("robots.txt does not disallow indexing staging")
  elif kind in ("catalog","revisions","content","wpjson") and status==200:
    try:obj=json.loads(txt)
    except Exception: errors.append("not JSON");obj={}
    if kind=="catalog" and (obj.get("clinical")!=443 or obj.get("support")!=237 or len(obj.get("records",[]))!=680):
      errors.append("catalog counts mismatch")
    if kind=="revisions" and not (isinstance(obj.get("items"),list) and isinstance(obj.get("active"),bool)):
      errors.append("revision API shape mismatch")
    if kind=="content" and not isinstance(obj.get("items"),list):
      errors.append("content API shape mismatch")
  results.append({"path":path,"status":status,"result":"FAIL" if errors else "PASS","content_type":headers.get("content-type","")[:80],"x_robots_tag":headers.get("x-robots-tag","")[:90],"errors":errors,"redirected":urlsplit(final_url).path!=path})
print("SML MappaMenta public-only staging smoke report")
for r in results:
  print(f"{r['result']:<8} {str(r['status']):<13} {r['path']}")
  if r.get("errors"): print("  "+", ".join(r["errors"]))
  if r.get("reason"): print("  "+r["reason"])
  if r.get("x_robots_tag"): print("  X-Robots-Tag: "+r["x_robots_tag"])
print(f"Totals: PASS={sum(r['result']=='PASS' for r in results)}, FAIL={sum(r['result']=='FAIL' for r in results)}, UNKNOWN={sum(r['result']=='UNKNOWN' for r in results)}")
if any(r["result"]=="FAIL" for r in results):sys.exit(1)
if any(r["result"]=="UNKNOWN" for r in results):sys.exit(2)

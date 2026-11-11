#!/usr/bin/env python3
"""Read-only link audit for the Tor Vergata WordPress pilot and official services.

No login, no credentials, no patient data, no email submission.
GET with a modest UA because some official sites reject HEAD/bots.
"""
import json
import urllib.error
import urllib.request
from urllib.parse import urlsplit
from datetime import datetime, timezone
import time
BASE="https://mappamenta.altervista.org"
URLS = [
  ("PTV studenti", "https://web.uniroma2.it/contenuto/sportello-ptv-per-studenti-e-studentesse"),
  ("Counselling personale", "https://web.uniroma2.it/contenuto/counselling-psicologico-per-il-personale-dellateneo"),
  ("CARIS counselling studenti", "https://caris.uniroma2.it/counselling-psicologico/"),
  ("First Point", "https://sostenibile.uniroma2.it/sportelli-dedicati-dedicated-help-desks/"),
  ("Pro-Ben", "https://orientamento.uniroma2.it/conta-su-di-noi-servizi-di-supporto-agli-studenti/")
]
def get(url, cap=180000):
    req=urllib.request.Request(url,headers={
      "User-Agent":"Mozilla/5.0 (compatible; MentaCampusLinkAudit/0.1; https://mappamenta.altervista.org/tor-vergata/)",
      "Accept":"text/html,application/json;q=0.9,*/*;q=0.8"
    })
    try:
        with urllib.request.urlopen(req,timeout=18) as response:
            return response.status,response.url,response.read(cap).decode("utf-8","replace")
    except urllib.error.HTTPError as e:
        return e.code,e.url,e.read(4000).decode("utf-8","replace")
    except Exception as e:
        return "UNKNOWN",url,type(e).__name__
status, final, body=get(BASE+"/tor-vergata/servizi.json",500000)
data={}
if status==200:
    try: data=json.loads(body)
    except json.JSONDecodeError: pass
print("Link audit date (UTC):",datetime.now(timezone.utc).isoformat(timespec="seconds"))
print("Published Menta Campus dataset: HTTP",status)
if data:
    services=data.get("university",[])
    print("Published sources:",[(r.get("id"),urlsplit(r.get("source","")).path) for r in services])
    print("Published university resources:",len(services))
else:print("Dataset unavailable/unreadable; official source checks still proceed")
hard_error=False
for label,url in URLS:
    code,final,body=get(url)
    alive = (code==200 and len(body)>80)
    if alive: result="PASS"
    elif code in (404,410): result="BROKEN";hard_error=True
    else: result="REVIEW"
    print(f"{result:6} | {str(code):8} | {label:27} | {urlsplit(final).netloc}{urlsplit(final).path}")
    time.sleep(.5)
if hard_error: raise SystemExit(1)

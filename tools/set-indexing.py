#!/usr/bin/env python3
from pathlib import Path
import argparse, json, re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mappatura-servizi-assistenza-psicologica.pages.dev/"
INDEXABLE = [
    "mappa.html","giovani.html","index.html","servizi.html","guide/index.html","guide/primo-percorso.html",
    "guide/pubblico.html","guide/privato.html","guide/ricovero.html",
    "guide/riabilitazione.html","ascolto.html","helpline.html","centri-ascolto.html",
    "universita.html","scuole.html","privati.html","strutture-approfondite.html",
    "studenti.html","orientamento-servizi.html","glossario.html","metodo.html"
]
ROBOTS_OFF = "noindex,nofollow,noarchive,nosnippet,noimageindex"
ROBOTS_ON = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"

def set_robots_meta(path, value):
    p = ROOT/path
    c = p.read_text(encoding="utf-8")
    pat = r'<meta\b(?=[^>]*\bname=["\']robots["\'])[^>]*>'
    rep = f'<meta name="robots" content="{value}"/>'
    if re.search(pat,c,flags=re.I):
        c = re.sub(pat,rep,c,count=1,flags=re.I)
    else:
        c = c.replace("</head>",rep+"</head>",1)
    p.write_text(c,encoding="utf-8")

def update_global_header(enable):
    p=ROOT/"_headers"
    lines=p.read_text(encoding="utf-8").splitlines()
    out=[]; in_global=False; inserted=False
    for line in lines:
        if line.startswith("/") and not line.startswith("  "):
            if in_global and not enable and not inserted:
                out.append("  X-Robots-Tag: "+ROBOTS_OFF); inserted=True
            in_global=(line.strip()=="/*")
            out.append(line)
            continue
        if in_global and line.strip().lower().startswith("x-robots-tag:"):
            if enable:
                continue
            if not inserted:
                out.append("  X-Robots-Tag: "+ROBOTS_OFF); inserted=True
            continue
        out.append(line)
    if in_global and not enable and not inserted:
        out.append("  X-Robots-Tag: "+ROBOTS_OFF)
    p.write_text("\n".join(out).rstrip()+"\n",encoding="utf-8")

def update_robots(enable):
    if enable:
        text=("User-agent: *\nAllow: /\n"
              f"Sitemap: {BASE}sitemap.xml\n")
    else:
        text=("User-agent: *\nAllow: /\n"
              "# Indicizzazione disattivata: le pagine inviano noindex via HTML e HTTP.\n"
              "# sitemap.xml è predisposta ma non pubblicizzata finché il sito resta fuori dai motori di ricerca.\n")
    (ROOT/"robots.txt").write_text(text,encoding="utf-8")

def update_version(enable):
    p=ROOT/"version.json"
    v=json.loads(p.read_text(encoding="utf-8"))
    v["indexing_enabled"]=bool(enable)
    v["sitemap_ready"]=True
    v["indexing_policy"]=(
        "index_follow_for_public_pages; technical_and_legacy_resources_remain_noindex"
        if enable else
        "noindex_html_and_http; robots_allows_crawl_to_observe_noindex; sitemap_not_announced"
    )
    v["deployment_checked_by_preparer"]=False
    p.write_text(json.dumps(v,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

def main():
    ap=argparse.ArgumentParser(description="Toggle search-engine indexing without changing content or datasets.")
    g=ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--enable",action="store_true")
    g.add_argument("--disable",action="store_true")
    args=ap.parse_args()
    enable=args.enable
    for path in INDEXABLE:
        set_robots_meta(path, ROBOTS_ON if enable else ROBOTS_OFF)
    update_global_header(enable)
    update_robots(enable)
    update_version(enable)
    print("indexing_enabled="+str(enable).lower())
    print("indexable_pages="+str(len(INDEXABLE)))
    print("technical/legacy paths keep path-specific noindex headers")

if __name__=="__main__":
    main()

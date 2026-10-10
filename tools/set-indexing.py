#!/usr/bin/env python3
from pathlib import Path
import argparse, json, re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mappatura-servizi-assistenza-psicologica.pages.dev/"
INDEXABLE = [
    "index.html",
    "servizi.html",
    "mappa.html",
    "orientati.html",
    "aiuto-adesso.html",
    "supporto-territoriale.html",
    "giovani.html",
    "guide/index.html",
    "guide/primo-percorso.html",
    "guide/pubblico.html",
    "guide/privato.html",
    "guide/ricovero.html",
    "guide/riabilitazione.html",
    "ascolto.html",
    "helpline.html",
    "centri-ascolto.html",
    "universita.html",
    "scuole.html",
    "privati.html",
    "strutture-approfondite.html",
    "studenti.html",
    "orientamento-servizi.html",
    "glossario.html",
    "metodo.html",
    "esplora-servizi.html",
    "territori/roma.html",
    "territori/frosinone.html",
    "territori/latina.html",
    "territori/rieti.html",
    "territori/viterbo.html",
    "tipi-servizi/csm.html",
    "tipi-servizi/serd.html",
    "tipi-servizi/spdc.html",
    "tipi-servizi/stpit.html",
    "tipi-servizi/consultori.html",
    "tipi-servizi/centri-diurni.html",
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
    # Additional crawl barrier for technical/download paths, even when
    # individual HTTP X-Robots-Tag rules are not emitted by the CDN.
    blocked = ["/admin/","/api/","/data/","/downloads/","/offline/","/tools/","/research/","/lib/","/migrations/","/.github/","/version.json","/VERSION.json","/README.md","/CHANGELOG.md","/PROJECT_STATUS.md","/MANIFEST_SHA256_WEB.txt","/_worker.js","/_routes.json"]
    text = "User-agent: *\nAllow: /\n"
    text += "".join("Disallow: " + path + "\n" for path in blocked)
    if enable:
        text += f"Sitemap: {BASE}sitemap.xml\n"
    else:
        text += "# Indicizzazione pubblica disattivata via meta robots e header globali.\n"
    (ROOT / "robots.txt").write_text(text, encoding="utf-8")

def update_sitemap():
    """One canonical, indexable public URL per item; omit unverifiable lastmod dates."""
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for path in INDEXABLE:
        if not (ROOT / path).is_file():
            raise FileNotFoundError(path)
        url = BASE if path == "index.html" else BASE + path
        lines.extend(['  <url>', f'    <loc>{url}</loc>', '  </url>'])
    lines.append('</urlset>')
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")


def update_version(enable):
    p=ROOT/"version.json"
    v=json.loads(p.read_text(encoding="utf-8"))
    v["indexing_enabled"]=bool(enable)
    v["sitemap_ready"]=True
    v["indexable_public_pages"]=len(INDEXABLE)
    v["indexing_reviewed_on"]="2026-10-09"
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
    update_sitemap()
    update_robots(enable)
    update_version(enable)
    print("indexing_enabled="+str(enable).lower())
    print("indexable_pages="+str(len(INDEXABLE)))
    print("technical/legacy paths keep path-specific noindex headers")

if __name__=="__main__":
    main()

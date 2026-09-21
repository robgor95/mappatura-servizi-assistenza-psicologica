#!/usr/bin/env python3
from pathlib import Path
import json, re, html
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mappatura-servizi-assistenza-psicologica.pages.dev/"
ROBOTS_OFF = "noindex,nofollow,noarchive,nosnippet,noimageindex"

SEO = {
    "index.html": ("Salute mentale nel Lazio | Servizi, guide e orientamento",
        "Trova servizi di salute mentale nel Lazio, consulta guide chiare e numeri utili. Menta aiuta a orientarsi senza fare diagnosi."),
    "servizi.html": ("Trova un servizio di salute mentale nel Lazio",
        "Cerca servizi di salute mentale nel Lazio per tipo, territorio e ASL: CSM, SerD, SPDC, STPIT, centri diurni e altre strutture censite."),
    "guide/index.html": ("Guide alla salute mentale e ai servizi nel Lazio",
        "Guide pratiche per capire da dove iniziare, servizi pubblici, professionisti privati, ricovero, comunità e riabilitazione."),
    "guide/primo-percorso.html": ("Da dove iniziare un percorso di salute mentale",
        "Psicologo, psicoterapeuta, psichiatra e primo colloquio: una guida per orientarsi tra le possibilità senza scegliere da soli un trattamento."),
    "guide/pubblico.html": ("Servizi pubblici di salute mentale nel Lazio | Guida",
        "Come orientarsi tra servizi pubblici, CSM, consultori e accesso alle cure nel Lazio, con domande utili e limiti da verificare."),
    "guide/privato.html": ("Come scegliere psicologo o psicoterapeuta | Guida",
        "Qualifiche, primo colloquio, costi e principali approcci psicoterapeutici: domande utili per scegliere un professionista nel privato."),
    "guide/ricovero.html": ("Ricovero psichiatrico, SPDC e STPIT | Guida",
        "Differenze tra emergenza, SPDC, STPIT, ricovero volontario e TSO, con indicazioni generali per capire i percorsi."),
    "guide/riabilitazione.html": ("Comunità, centri diurni e riabilitazione psichiatrica",
        "Come orientarsi tra comunità, strutture residenziali, semiresidenziali e centri diurni, con domande da fare prima di un inserimento."),
    "ascolto.html": ("Numeri utili e ascolto per la salute mentale nel Lazio",
        "Numeri di emergenza, sanità non urgente, ascolto emotivo e servizi di orientamento nel Lazio, con funzioni e limiti distinti."),
    "helpline.html": ("Helpline e ascolto psicologico nel Lazio",
        "Helpline e numeri di ascolto disponibili per diversi bisogni: verifica orari, destinatari e funzione di ogni servizio."),
    "centri-ascolto.html": ("Centri e sportelli di ascolto nel Lazio",
        "Consulta centri e sportelli di ascolto, consultori, spazi giovani e altri servizi territoriali del Lazio con contatti e accesso documentati."),
    "universita.html": ("Supporto psicologico universitario nel Lazio",
        "Counselling, ascolto e supporto psicologico nelle università del Lazio: destinatari, accesso, costi e limiti degli incontri quando documentati."),
    "scuole.html": ("Sportelli psicologici scolastici nel Lazio",
        "Sportelli di ascolto e supporto psicologico nelle scuole del Lazio, con stato delle informazioni e destinatari quando documentati."),
    "privati.html": ("Strutture e servizi psicologici privati nel Lazio",
        "Centri e servizi privati di psicologia, psicoterapia e psichiatria nel Lazio, senza classifiche o raccomandazioni."),
    "strutture-approfondite.html": ("Comunità, STPIT e centri diurni nel Lazio",
        "Informazioni su comunità, STPIT, strutture residenziali e semiresidenziali e centri diurni già presenti nella mappatura."),
    "studenti.html": ("Supporto psicologico per studenti nel Lazio",
        "Orientamento ai servizi psicologici per studenti universitari e scolastici nel Lazio, con collegamenti alle mappature dedicate."),
    "orientamento-servizi.html": ("CSM, SerD, SPDC e STPIT: come funzionano i servizi",
        "Spiegazioni semplici delle principali sigle e funzioni dei servizi di salute mentale: CSM, SerD, SPDC, STPIT, TSMREE/NPIA e altri."),
    "glossario.html": ("Glossario dei servizi di salute mentale",
        "Significato delle principali sigle e parole usate nei servizi di salute mentale del Lazio, con rimandi alle guide di orientamento."),
    "metodo.html": ("Fonti e metodo della mappatura salute mentale Lazio",
        "Come vengono raccolte, verificate e presentate le informazioni sui servizi di salute mentale nel Lazio e quali sono i limiti della mappatura."),
}
ALL_HTML = [
    "404.html","archivio.html","ascolto.html","centri-ascolto.html","documenti.html",
    "glossario.html","guide/index.html","guide/primo-percorso.html","guide/privato.html",
    "guide/pubblico.html","guide/riabilitazione.html","guide/ricovero.html","helpline.html",
    "index.html","metodo.html","orientamento-servizi.html","privacy.html","privati.html",
    "qualita-dati.html","scuole.html","servizi.html","strutture-approfondite.html",
    "studenti.html","universita.html"
]

def canonical_for(path):
    if path == "index.html":
        return BASE
    if path == "archivio.html":
        return urljoin(BASE, "servizi.html")
    return urljoin(BASE, path)

def set_tag(content, pattern, replacement, insert_before="</head>"):
    if re.search(pattern, content, flags=re.I|re.S):
        return re.sub(pattern, replacement, content, count=1, flags=re.I|re.S)
    return content.replace(insert_before, replacement + insert_before, 1)

def meta_name(content, name, value):
    value = html.escape(value, quote=True)
    pat = rf'<meta\b(?=[^>]*\bname=["\']{re.escape(name)}["\'])[^>]*>'
    rep = f'<meta name="{name}" content="{value}"/>'
    return set_tag(content, pat, rep)

def meta_prop(content, prop, value):
    value = html.escape(value, quote=True)
    pat = rf'<meta\b(?=[^>]*\bproperty=["\']{re.escape(prop)}["\'])[^>]*>'
    rep = f'<meta property="{prop}" content="{value}"/>'
    return set_tag(content, pat, rep)

def link_canonical(content, url):
    pat = r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>'
    rep = f'<link rel="canonical" href="{html.escape(url, quote=True)}"/>'
    return set_tag(content, pat, rep)

def remove_canonical(content):
    return re.sub(r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>', '', content, flags=re.I)

def title_set(content, title):
    rep = f'<title>{html.escape(title)}</title>'
    return set_tag(content, r'<title>.*?</title>', rep)

def add_home_jsonld(content, description):
    marker = 'id="seo-website-jsonld"'
    if marker in content:
        return content
    data = {
      "@context":"https://schema.org",
      "@type":"WebSite",
      "@id": BASE + "#website",
      "name":"Salute mentale Lazio",
      "alternateName":"Mappatura salute mentale · Lazio",
      "url":BASE,
      "inLanguage":"it-IT",
      "description":description,
      "potentialAction":{
        "@type":"SearchAction",
        "target":BASE+"servizi.html?q={search_term_string}",
        "query-input":"required name=search_term_string"
      }
    }
    block = '<script type="application/ld+json" id="seo-website-jsonld">' + json.dumps(data, ensure_ascii=False, separators=(',',':')) + '</script>'
    return content.replace("</head>", block+"</head>", 1)

def prepare_html(path):
    p = ROOT/path
    c = p.read_text(encoding="utf-8")
    c = meta_name(c, "robots", ROBOTS_OFF)
    if path in SEO:
        title, desc = SEO[path]
        c = title_set(c, title)
        c = meta_name(c, "description", desc)
        c = link_canonical(c, canonical_for(path))
        c = meta_prop(c, "og:title", title)
        c = meta_prop(c, "og:description", desc)
        c = meta_prop(c, "og:type", "website")
        c = meta_prop(c, "og:locale", "it_IT")
        c = meta_prop(c, "og:site_name", "Salute mentale Lazio")
        c = meta_prop(c, "og:url", canonical_for(path))
        c = meta_prop(c, "og:image", urljoin(BASE, "assets/menta/menta-base.webp"))
        c = meta_prop(c, "og:image:alt", "Menta, guida visiva del portale Salute mentale Lazio")
        c = meta_name(c, "twitter:card", "summary")
        c = meta_name(c, "twitter:title", title)
        c = meta_name(c, "twitter:description", desc)
        c = meta_name(c, "twitter:image", urljoin(BASE, "assets/menta/menta-base.webp"))
        if path == "index.html":
            c = add_home_jsonld(c, desc)
    elif path == "archivio.html":
        c = link_canonical(c, canonical_for(path))
    elif path == "404.html":
        c = remove_canonical(c)
    p.write_text(c, encoding="utf-8")

for path in ALL_HTML:
    prepare_html(path)

urls = [canonical_for(p) for p in SEO]
sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    sitemap += ["  <url>", f"    <loc>{html.escape(u)}</loc>", "    <lastmod>2026-09-21</lastmod>", "  </url>"]
sitemap.append("</urlset>")
(ROOT/"sitemap.xml").write_text("\n".join(sitemap)+"\n", encoding="utf-8")

(ROOT/"robots.txt").write_text(
    "User-agent: *\nAllow: /\n"
    "# Indicizzazione disattivata: le pagine inviano noindex via HTML e HTTP.\n"
    "# sitemap.xml è predisposta ma non pubblicizzata finché il sito resta fuori dai motori di ricerca.\n",
    encoding="utf-8"
)

headers = (ROOT/"_headers").read_text(encoding="utf-8")

# Keep exactly one global noindex header while preserving unrelated cache/security rules.
_lines = headers.splitlines()
_out = []
_in_global = False
_global_robot = False
for line in _lines:
    if line.startswith("/") and not line.startswith("  "):
        if _in_global and not _global_robot:
            _out.append("  X-Robots-Tag: " + ROBOTS_OFF)
            _global_robot = True
        _in_global = (line.strip() == "/*")
        _global_robot = False
        _out.append(line)
        continue
    if _in_global and line.strip().lower().startswith("x-robots-tag:"):
        if not _global_robot:
            _out.append("  X-Robots-Tag: " + ROBOTS_OFF)
            _global_robot = True
        continue
    _out.append(line)
if _in_global and not _global_robot:
    _out.append("  X-Robots-Tag: " + ROBOTS_OFF)
headers = "\n".join(_out).rstrip()

def remove_header_blocks(text, markers):
    lines = text.splitlines()
    out = []
    skip = False
    for line in lines:
        if line.startswith("/") and not line.startswith("  "):
            skip = line.strip() in markers
            if skip:
                continue
        if skip:
            continue
        out.append(line)
    return "\n".join(out).rstrip()

cache_overrides = r'''
/assets/site-v7-4.js
  Cache-Control: no-cache, must-revalidate
/assets/directory-v7-5.js
  Cache-Control: no-cache, must-revalidate
/assets/servizi-v7-5-1.js
  Cache-Control: no-cache, must-revalidate
'''.strip()

extra = r'''
/downloads/*
  Cache-Control: public, max-age=3600
  X-Robots-Tag: noindex, nofollow, noarchive
/data/*
  Cache-Control: no-cache
  X-Robots-Tag: noindex, nofollow, noarchive
/offline/*
  X-Robots-Tag: noindex, nofollow, noarchive
/archivio.html
  X-Robots-Tag: noindex, follow
/interfaccia-precedente.html
  X-Robots-Tag: noindex, nofollow, noarchive
/404.html
  X-Robots-Tag: noindex, nofollow, noarchive
/documenti.html
  X-Robots-Tag: noindex, follow
/qualita-dati.html
  X-Robots-Tag: noindex, follow
/privacy.html
  X-Robots-Tag: noindex, follow
'''.strip()

markers = {
    "/assets/site-v7-4.js", "/assets/directory-v7-5.js", "/assets/servizi-v7-5-1.js",
    "/downloads/*", "/data/*", "/offline/*", "/archivio.html", "/interfaccia-precedente.html",
    "/404.html", "/documenti.html", "/qualita-dati.html", "/privacy.html"
}
headers = remove_header_blocks(headers, markers)
headers = headers.rstrip() + "\n\n" + cache_overrides + "\n\n" + extra + "\n"
(ROOT/"_headers").write_text(headers, encoding="utf-8")

vp = ROOT/"version.json"
v = json.loads(vp.read_text(encoding="utf-8"))
v["web_version"] = "7.7.4"
v["seo_version"] = "7.7.4"
v["indexing_enabled"] = False
v["sitemap_ready"] = True
v["indexing_policy"] = "noindex_html_and_http; robots_allows_crawl_to_observe_noindex; sitemap_not_announced"
v["deployment_checked_by_preparer"] = False
v["release_note"] = "SEO predisposto ma indicizzazione disattivata: canonical, metadata social, sitemap e dati strutturati pronti; noindex resta attivo via HTML e HTTP."
vp.write_text(json.dumps(v, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")

ch = ROOT/"CHANGELOG.md"
ct = ch.read_text(encoding="utf-8")
section = """## 7.7.4 — 21 settembre 2026

- Predisposizione SEO completa senza attivare l’indicizzazione.
- Canonical, title, description, Open Graph e Twitter metadata uniformati sulle pagine utente.
- Sitemap XML pronta ma non annunciata ai crawler finché il sito resta fuori dai risultati di ricerca.
- Noindex mantenuto in HTML e rafforzato con X-Robots-Tag; robots.txt consente il crawl necessario a leggere noindex.
- Dati strutturati WebSite/SearchAction predisposti in home.
- Archivio legacy, 404, documenti tecnici, dataset, download e pagina qualità restano esclusi dall’indicizzazione anche per il futuro.
- Aggiunto uno script controllato per abilitare/disabilitare l’indicizzazione in una futura release.
- Nessuna modifica ai dataset sanitari o alla logica di Menta.

"""
if "## 7.7.4" not in ct:
    ct = ct.replace("# Changelog\n\n", "# Changelog\n\n"+section)
ch.write_text(ct, encoding="utf-8")

rp = ROOT/"README.md"
rt = rp.read_text(encoding="utf-8")
rt = rt.replace("## Versione corrente V7.7.3", "## Versione corrente V7.7.4")
rt = rt.replace("La produzione usa **V7.7.3**", "La produzione usa **V7.7.4**")
if "### Indicizzazione e SEO" not in rt:
    insert = """
### Indicizzazione e SEO

La struttura SEO è predisposta, ma **l’indicizzazione pubblica è disattivata**. Le pagine principali hanno title, description, canonical, metadata social e sitemap già pronti; noindex è applicato sia nell’HTML sia negli header HTTP. robots.txt consente il crawl per permettere ai motori di leggere il noindex, ma non pubblicizza la sitemap.

Quando si deciderà di aprire il sito ai motori di ricerca, usare python tools/set-indexing.py --enable su un branch dedicato, verificare la preview e solo dopo portare la modifica su main. Dataset, download, pagine legacy e documentazione tecnica rimangono esclusi dall’indicizzazione.

"""
    marker = "### Verifica della versione corrente"
    rt = rt.replace(marker, insert+marker)
rp.write_text(rt, encoding="utf-8")

(ROOT/"downloads/Note_Rilascio_V7_7_4.txt").write_text(
"""SEO / indicizzazione 7.7.4

La struttura SEO è pronta, ma il sito resta volontariamente fuori dai risultati dei motori di ricerca.

Attivo ora:
- meta robots noindex/nofollow/noarchive/nosnippet/noimageindex;
- X-Robots-Tag globale equivalente;
- canonical coerenti;
- title e description orientati all’utente;
- Open Graph e Twitter metadata;
- dati strutturati WebSite/SearchAction in home;
- sitemap.xml predisposta ma non annunciata in robots.txt.

robots.txt consente il crawl perché un motore deve poter leggere il noindex. Questo non rende il sito indicizzabile.
Noindex non è un controllo di accesso: chi possiede il link può aprire il sito.

Per il futuro:
- eseguire tools/set-indexing.py --enable su un branch;
- verificare preview, canonical, sitemap, header e pagine;
- solo dopo unire su main e, se desiderato, inviare sitemap.xml ai motori.

Sempre esclusi dall’indicizzazione: archivio legacy, 404, documenti tecnici, qualità dati, privacy, dataset, download, offline e interfaccia precedente.

Nessuna modifica ai dati sanitari o all’orientatore Menta.
""", encoding="utf-8")

#!/usr/bin/env python3
"""Audit offline SEO: eseguire con python tools/test-seo-landings.py."""
import ast
import html
import json
import re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, parse_qs, unquote

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://mappatura-servizi-assistenza-psicologica.pages.dev/"
LANDINGS = [
 "esplora-servizi.html", "territori/roma.html", "territori/frosinone.html",
 "territori/latina.html", "territori/rieti.html", "territori/viterbo.html",
 "tipi-servizi/csm.html", "tipi-servizi/serd.html", "tipi-servizi/spdc.html",
 "tipi-servizi/stpit.html", "tipi-servizi/consultori.html", "tipi-servizi/centri-diurni.html",
]

class HTMLAudit(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.links, self.anchors, self.scripts = [], [], [], []
        self.h1, self.titles, self.script_buffer = 0, 0, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "meta": self.meta.append(a)
        if tag == "link": self.links.append(a)
        if tag == "a": self.anchors.append(a.get("href", ""))
        if tag == "h1": self.h1 += 1
        if tag == "title": self.titles += 1
        if tag == "script" and a.get("type") == "application/ld+json":
            self.script_buffer = []
            self.scripts.append(self.script_buffer)

    def handle_data(self, value):
        if self.script_buffer is not None: self.script_buffer.append(value)

    def handle_endtag(self, tag):
        if tag == "script": self.script_buffer = None

def assert_ok(condition, message):
    if not condition: raise AssertionError(message)

def canonical(path):
    return BASE if path == "index.html" else BASE + path

def load_indexable():
    tree = ast.parse((ROOT / "tools/set-indexing.py").read_text(encoding="utf-8"))
    assign = next(node for node in tree.body
       if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "INDEXABLE" for t in node.targets))
    return ast.literal_eval(assign.value)

def run():
    indexable = load_indexable()
    assert_ok(len(indexable) == 36 and len(set(indexable)) == 36, "INDEXABLE non allineato")
    sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    locs = re.findall(r"<loc>([^<]+)</loc>", sitemap)
    assert_ok(len(locs) == 36 and len(set(locs)) == 36, "Sitemap non contiene 36 URL unici")
    assert_ok(set(locs) == {canonical(path) for path in indexable}, "Sitemap e INDEXABLE non coincidono")
    version = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))
    assert_ok(version.get("indexable_public_pages") == 36 and version.get("indexing_enabled"), "version.json non allineato")
    catalog = json.loads((ROOT / "data/editorial-catalog-v7-18.json").read_text(encoding="utf-8"))
    keys = {row["key"] for row in catalog["records"]}
    examples = 0
    for path in indexable:
        f = ROOT / path
        assert_ok(f.is_file(), f"File inesistente: {path}")
        source = f.read_text(encoding="utf-8")
        doc = HTMLAudit()
        doc.feed(source)
        assert_ok(doc.titles == 1 and doc.h1 == 1, f"Tag title o H1 non unici: {path}")
        assert_ok(any(x.get("name") == "robots" and x.get("content", "").startswith("index,follow") for x in doc.meta), f"Robots errato: {path}")
        canonical_links = [x.get("href") for x in doc.links if x.get("rel") == "canonical"]
        assert_ok(canonical_links == [canonical(path)], f"Canonical errato: {path}")
        if path not in LANDINGS: continue
        assert_ok("/assets/ux-ui-v7-18.js" in source, f"Menu responsive assente: {path}")
        assert_ok(any(x.get("name") == "description" and x.get("content") for x in doc.meta), f"Description mancante: {path}")
        assert_ok(len(doc.scripts) == 1, f"JSON-LD non unico: {path}")
        graph = json.loads("".join(doc.scripts[0])).get("@graph", [])
        assert_ok(any(x.get("@type") == "BreadcrumbList" for x in graph), f"Breadcrumb JSON-LD assente: {path}")
        assert_ok(any(x.get("@type") in ("WebPage", "CollectionPage") and x.get("url") == canonical(path) for x in graph), f"WebPage JSON-LD incoerente: {path}")
        for href in doc.anchors:
            if not href.startswith("/"): continue
            parts = urlsplit(html.unescape(href))
            linked = unquote(parts.path).lstrip("/")
            if linked: assert_ok((ROOT/linked).exists(), f"Link mancante: {path} -> {href}")
            for key in parse_qs(parts.query).get("scheda", []):
                examples += 1
                assert_ok(key in keys, f"Record inesistente: {path} -> {key}")
        for tag in doc.links:
            if tag.get("rel") in ("stylesheet", "icon") and tag.get("href", "").startswith("/"):
                assert_ok((ROOT/tag["href"].lstrip("/")).is_file(), f"Asset inesistente: {path} -> {tag['href']}")
    assert_ok(examples == 20, f"Attese 20 schede cliniche di esempio, trovate {examples}")
    for path in ("index.html", "servizi.html"):
        assert_ok('/esplora-servizi.html' in (ROOT/path).read_text(encoding="utf-8"), f"Hub non collegato: {path}")
    print("OK: 36 URL indicizzabili, 12 pagine, 20 schede reali, canonical, JSON-LD, link e menu responsive.")

if __name__ == "__main__": run()

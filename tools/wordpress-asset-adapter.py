#!/usr/bin/env python3
"""WordPress-only adaptations of copied V7.18 public assets.
Never mutate the Cloudflare source tree or application release version.
"""
from pathlib import Path
import sys

def replace(path: Path, old: str, new: str, expected: int) -> None:
    text=path.read_text(encoding="utf-8")
    count=text.count(old)
    if count!=expected:
        raise ValueError(f"unexpected {path.name} token count {count} (expected {expected}) for {old!r}")
    path.write_text(text.replace(old,new),encoding="utf-8")

def main(directory):
    public=Path(directory)
    a=public/"assets"/"editorial-data-v7-18.js"
    b=public/"assets"/"editorial-public-v7-18.mjs"
    replace(a, "/api/public/revisions", "/wp-json/sml/v1/revisions", 1)
    replace(b, "/api/public/content", "/wp-json/sml/v1/content", 1)
    replace(b, "if(c.image_id)", "if(c.image_id && c.image_url)", 3)
    replace(b, "src:'/api/public/media/'+encodeURIComponent(c.image_id)", "src:c.image_url", 3)
    # Prevent browser/CDN from reusing the stale pre-fix JS in the original staging.
    updated=0
    for page in public.rglob("*.html"):
        text=page.read_text(encoding="utf-8")
        for asset in ("/assets/editorial-data-v7-18.js","/assets/editorial-public-v7-18.mjs"):
            if asset in text:
                text=text.replace(asset,asset+"?sml-wp=0.4")
                updated+=1
        page.write_text(text,encoding="utf-8")
    if updated<2:raise ValueError("expected HTML references to both editorial assets")
    if "/api/public/revisions" in a.read_text(encoding="utf-8") or "/api/public/" in b.read_text(encoding="utf-8"):
        raise ValueError("unadapted legacy API reference still present")
    print(f"WordPress API adaptation complete, {updated} HTML references cache-busted")
if __name__=="__main__":
    if len(sys.argv)!=2:raise SystemExit("usage: wordpress-asset-adapter.py LEGACY_DIRECTORY")
    main(sys.argv[1])

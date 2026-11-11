#!/usr/bin/env python3
"""Build a self-contained WordPress plugin for Tor Vergata.
Uses the current pilot checkout. Does not modify regional site or database.
"""
from __future__ import annotations
import json, os, shutil, subprocess, sys, zipfile
from pathlib import Path

PLUGIN = 'sml-tor-vergata'

def replace_once(text: str, original: str, updated: str, minimum: int = 1) -> str:
    if text.count(original) < minimum:
        raise RuntimeError(f'Expected reference missing: {original}')
    return text.replace(original, updated)

def build(root: Path, destination: Path) -> None:
    root = root.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    stage = destination / PLUGIN
    if stage.exists(): shutil.rmtree(stage)
    public = stage / 'public'
    public.mkdir(parents=True, exist_ok=True)
    plugin_php = root / 'wordpress' / PLUGIN / (PLUGIN + '.php')
    shutil.copyfile(plugin_php, stage / plugin_php.name)
    shutil.copyfile(root / 'wordpress' / PLUGIN / 'editorial.php',stage / 'editorial.php')
    src = root / 'pilot' / 'tor-vergata'
    html = (src / 'index.html').read_text(encoding='utf-8')
    html = replace_once(html, '/assets/menta/menta-base-v7-10-1.webp', '/tor-vergata/assets/menta.webp', 2)
    html = replace_once(html, '/assets/vendor/leaflet/leaflet.css', '/tor-vergata/assets/leaflet/leaflet.css')
    html = replace_once(html, '/assets/vendor/leaflet/leaflet.js', '/tor-vergata/assets/leaflet/leaflet.js')
    (public / 'index.html').write_text(html, encoding='utf-8')
    for name in ('tv.js', 'tv.css'):
        shutil.copyfile(src / name, public / name)
    dataset = public / 'servizi.json'
    subprocess.run([sys.executable, str(root/'tools/build-tor-vergata-pilot.py'), str(root), str(dataset)], check=True)
    data = json.loads(dataset.read_text(encoding='utf-8'))
    assert data['pilot'] == 'tor-vergata' and data['source_version'] == '7.18'
    assert len(data['clinical']) == 52 and data['count_8km'] == 19 and len(data['university']) == 5
    assert len({s['key'] for s in data['clinical']}) == 52
    source = root / 'assets'
    (public/'assets'/'leaflet'/'images').mkdir(parents=True)
    shutil.copyfile(source/'menta'/'menta-base-v7-10-1.webp', public/'assets'/'menta.webp')
    for name in ('leaflet.js','leaflet.css'):
        shutil.copyfile(source/'vendor'/'leaflet'/name, public/'assets'/'leaflet'/name)
    for image in ('layers.png','layers-2x.png','marker-icon.png','marker-icon-2x.png','marker-shadow.png'):
        shutil.copyfile(source/'vendor'/'leaflet'/'images'/image, public/'assets'/'leaflet'/'images'/image)
    (public/'.htaccess').write_text('<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\nDeny from all\n</IfModule>\n',encoding='ascii')
    output = destination / 'MentaCampus_TorVergata_WordPress_0_2_0_Beta.zip'
    if output.exists(): output.unlink()
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(stage.rglob('*')):
            if f.is_file():
                z.write(f, f.relative_to(destination).as_posix())
    with zipfile.ZipFile(output) as z:
        assert z.testzip() is None
        names=set(z.namelist())
        assert (PLUGIN+'/'+PLUGIN+'.php') in names
        assert (PLUGIN+'/editorial.php') in names
        for file in ('index.html','tv.js','tv.css','servizi.json','assets/menta.webp','assets/leaflet/leaflet.js'):
            assert f'{PLUGIN}/public/{file}' in names
        assert b'noindex' in z.read(f'{PLUGIN}/{PLUGIN}.php')
        assert len(json.loads(z.read(f'{PLUGIN}/public/servizi.json'))['clinical'])==52
    manifest={
        'status':'STAGING ONLY, NON INDICIZZARE',
        'plugin_name':PLUGIN,'plugin_version':'0.2.0-beta','wp_path':'/tor-vergata/',
        'source_branch':'pilot/tor-vergata-wordpress',
        'source_git_sha':os.environ.get('GITHUB_SHA','local-test'),
        'source_version':'7.18',
        'clinical_8km':19,'clinical_12km':52,'university_resources':4,
        'zip_size':output.stat().st_size,
    }
    (destination/'manifest-microsito.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'OK WordPress plugin ZIP {output} ({output.stat().st_size:,} bytes)')

if __name__ == '__main__':
    if len(sys.argv)!=3: raise SystemExit('Usage: package-tor-vergata-plugin.py REPO_ROOT OUTPUT_DIR')
    build(Path(sys.argv[1]),Path(sys.argv[2]))

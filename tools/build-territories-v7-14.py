#!/usr/bin/env python3
"""Build Lazio municipality GeoJSON files for V7.14 from the pinned ISTAT 2026 archive.

The script transforms only official administrative geometry. It does not geocode,
move or infer any service location. One GeoJSON is written per province/metropolitan
territory so the browser can lazy-load only the selected territory.
"""
from pathlib import Path
import hashlib, io, json, sys, zipfile
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

ROOT=Path(__file__).resolve().parents[1]
SOURCE='https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip'
PAGE='https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/'
EXPECTED='b011a590656c3a3ebc297fba80726a376aa843b6f164641cf6a4a990021a81d6'
PROVINCES={56:'VT',57:'RI',58:'RM',59:'LT',60:'FR'}

def rounded(v):
    if isinstance(v,float): return round(v,6)
    if isinstance(v,(list,tuple)): return [rounded(x) for x in v]
    if isinstance(v,dict): return {k:rounded(x) for k,x in v.items()}
    return v

def main(path):
    raw=Path(path).read_bytes()
    digest=hashlib.sha256(raw).hexdigest()
    if digest!=EXPECTED:
        raise ValueError(f'ISTAT archive changed: {digest}; review source before updating expected hash.')
    z=zipfile.ZipFile(io.BytesIO(raw))
    base=next(n[:-4] for n in z.namelist() if n.startswith('Com') and n.endswith('.shp'))
    rd=shapefile.Reader(**{ext:io.BytesIO(z.read(base+'.'+ext)) for ext in ('shp','shx','dbf')},encoding='utf-8')
    tr=Transformer.from_crs(CRS.from_wkt(z.read(base+'.prj').decode()),4326,always_xy=True)
    grouped={c:[] for c in PROVINCES.values()}
    for rec in rd.iterShapeRecords():
        p=rec.record.as_dict()
        if p['COD_REG']!=12: continue
        code=PROVINCES.get(int(p['COD_PROV']))
        if not code: raise ValueError('Unexpected Lazio province code '+str(p['COD_PROV']))
        geom=transform(tr.transform,shape(rec.shape.__geo_interface__))
        if not geom.is_valid: raise ValueError('Invalid municipal geometry '+p['COMUNE'])
        center=geom.representative_point()
        grouped[code].append({
            'type':'Feature',
            'id':p['PRO_COM_T'],
            'properties':{
                'istat':p['PRO_COM_T'],
                'name':p['COMUNE'],
                'province':code,
                'label':[round(center.y,6),round(center.x,6)]
            },
            'geometry':mapping(geom)
        })
    total=sum(len(x) for x in grouped.values())
    if total!=378: raise ValueError(f'Expected 378 Lazio municipalities, got {total}')
    source={
        'publisher':'ISTAT','reference_date':'2026-01-01','source_url':SOURCE,
        'source_page':PAGE,'license':'CC BY 4.0',
        'license_url':'https://creativecommons.org/licenses/by/4.0/',
        'source_sha256':EXPECTED,
        'transform':'Generalized ISTAT municipality boundaries: Lazio subsets, WGS84 UTM32N to EPSG:4326, coordinates rounded to 6 decimals. Not legal/cadastral boundaries.'
    }
    for code,features in grouped.items():
        features.sort(key=lambda f:f['properties']['name'])
        obj=rounded({'type':'FeatureCollection','version':'7.14','province':code,'source':source,'features':features})
        out=ROOT/'data'/f'comuni_{code.lower()}_istat2026_v7_14.geojson'
        out.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n')
        print(out.name,len(features),out.stat().st_size,hashlib.sha256(out.read_bytes()).hexdigest())

if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('usage: build-territories-v7-14.py Limiti01012026_g.zip')
    main(sys.argv[1])

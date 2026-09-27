#!/usr/bin/env python3
"""Reproduce local province geometry and municipality lookup from pinned ISTAT data.

Only administrative boundaries are transformed; this does not geocode services.
Requires pyshp, pyproj and shapely. Pass the downloaded source ZIP as argv[1].
"""
from pathlib import Path
import hashlib, io, json, sys, unicodedata, re, zipfile
import shapefile
from pyproj import CRS, Transformer
from shapely.geometry import shape, mapping
from shapely.ops import transform

SOURCE = 'https://www.istat.it/storage/cartografia/confini_amministrativi/generalizzati/2026/Limiti01012026_g.zip'
PAGE = 'https://www.istat.it/notizia/confini-delle-unita-amministrative-a-fini-statistici-al-1-gennaio-2018-2/'
EXPECTED = 'b011a590656c3a3ebc297fba80726a376aa843b6f164641cf6a4a990021a81d6'
ROOT = Path(__file__).resolve().parents[1]

def norm(s):
    return re.sub(r'[^a-z0-9]+', ' ', ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if not unicodedata.combining(c))).strip()

def main(path):
    raw=Path(path).read_bytes()
    if hashlib.sha256(raw).hexdigest()!=EXPECTED:
        raise ValueError('ISTAT archive changed: review the new source before updating its hash.')
    z=zipfile.ZipFile(io.BytesIO(raw))
    def reader(prefix):
        base=next(n[:-4] for n in z.namelist() if n.startswith(prefix) and n.endswith('.shp'))
        return shapefile.Reader(**{ext:io.BytesIO(z.read(base+'.'+ext)) for ext in ('shp','shx','dbf')},encoding='utf-8'),base
    rd,base=reader('ProvCM')
    tr=Transformer.from_crs(CRS.from_wkt(z.read(base+'.prj').decode()),4326,always_xy=True)
    features=[]; codes={}
    for rec in rd.iterShapeRecords():
        p=rec.record.as_dict()
        if p['COD_REG']!=12:continue
        codes[p['COD_PROV']]=p['SIGLA']
        geom=shape(rec.shape.__geo_interface__)
        # Retain the official generalized vertices: shared borders and islands are not independently simplified.
        g=transform(tr.transform,geom)
        if not g.is_valid: raise ValueError('Invalid source geometry: '+p['SIGLA'])
        center=g.representative_point()
        features.append({'type':'Feature','id':p['SIGLA'],'properties':{'code':p['SIGLA'],'name':p['DEN_UTS'],'kind':p['TIPO_UTS'],'label':[round(center.y,6),round(center.x,6)]},'geometry':mapping(g)})
    if len(features)!=5:raise ValueError('Expected the five Lazio province/metropolitan territories')
    # Rounding is for display only; municipality attribution does not use point-in-polygon tests.
    def rounded(v):
        if isinstance(v,float):return round(v,6)
        if isinstance(v,(list,tuple)):return [rounded(x) for x in v]
        if isinstance(v,dict):return {k:rounded(x) for k,x in v.items()}
        return v
    source={'publisher':'ISTAT','reference_date':'2026-01-01','source_url':SOURCE,'source_page':PAGE,'license':'CC BY 4.0','license_url':'https://creativecommons.org/licenses/by/4.0/','source_sha256':EXPECTED,'transform':'Generalized ISTAT boundaries: Lazio subset, WGS84 UTM32N to EPSG:4326, coordinates rounded to 6 decimals. Not legal/cadastral boundaries.'}
    gj=rounded({'type':'FeatureCollection','source':source,'features':features})
    cr,_=reader('Com')
    towns={}
    for rr in cr.iterRecords():
        p=rr.as_dict()
        if p['COD_REG']==12:towns[norm(p['COMUNE'])]={'province':codes[p['COD_PROV']],'name':p['COMUNE'],'istat':p['PRO_COM_T']}
    if len(towns)!=378:raise ValueError('Unexpected municipality count; source requires review.')
    lookup={'version':'7.13','source':source,'municipalities':towns,'aliases':{'poggio moiano osteria nuova':{'municipality':'poggio moiano','basis':'Existing service town field explicitly states Poggio Moiano / Osteria Nuova; the named municipality is retained, not geocoded from the locality.'}}}
    for filename,obj in [('province_lazio_istat2026_v7_13.geojson',gj),('comuni_province_istat2026_v7_13.json',lookup)]:
        out=ROOT/'data'/filename;out.write_text(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n')
        print(filename,out.stat().st_size,hashlib.sha256(out.read_bytes()).hexdigest())

if __name__=='__main__':main(sys.argv[1])

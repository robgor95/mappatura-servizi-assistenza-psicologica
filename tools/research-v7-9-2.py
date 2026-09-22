"""V7.9.2 one-time research: fixed public service addresses only.
No browser/user input is sent to Nominatim. Single process, >=1.25s between
uncached requests, persistent artifact cache, no automatic retry on refusal.
Also snapshots current official/manager documentary sources for open cases.
"""
from pathlib import Path
import csv,json,hashlib,time,urllib.parse,urllib.request,urllib.error,re,sys
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]); OUT.mkdir(parents=True,exist_ok=True)
ROWS=json.loads(Path(sys.argv[2]).read_text())
UA='LazioMentalHealthMap/7.9.2 one-time-maintenance (+https://github.com/robgor95/mappatura-servizi-assistenza-psicologica)'
DATE='2026-09-22'
old=json.loads((ROOT/'data/presidi_geo_v7_9_1.json').read_text())
cache_path=OUT/'nominatim-v7-9-2.json'
cache={}
seed=ROOT/'downloads/Geocoding_Cache_V7_8.json'
if seed.exists():
    try: cache.update(json.loads(seed.read_text()))
    except Exception: pass
if cache_path.exists():
    cache.update(json.loads(cache_path.read_text()))

def norm(s):
    import unicodedata
    return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',str(s)).encode('ascii','ignore').decode().lower()).strip()

def usable_address(a):
    n=norm(a)
    return bool(n) and not any(x in n for x in ['non documentato','da verificare','da confermare']) and n not in {'nd'}

def req_json(url):
    rq=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
    with urllib.request.urlopen(rq,timeout=35) as r:return json.load(r)

calls=0;last=0.0;results={}
for row in ROWS:
    sk=row['key']; oldp=old['records'].get(sk,{})
    if oldp.get('lat') is not None or not usable_address(row.get('address','')): continue
    town=row.get('town','')
    if not town or ' / ' in town: continue
    q=', '.join([row['address'],town,'Lazio','Italia'])
    key='v792|'+norm(q)
    if key not in cache:
        if calls>=120: break
        wait=1.25-(time.monotonic()-last)
        if wait>0: time.sleep(wait)
        params={'q':q,'format':'jsonv2','addressdetails':1,'limit':5,'countrycodes':'it','accept-language':'it'}
        url='https://nominatim.openstreetmap.org/search?'+urllib.parse.urlencode(params)
        try:
            matches=req_json(url)
        except urllib.error.HTTPError as e:
            cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2))
            raise SystemExit('Nominatim refused request '+str(e.code)+'; stopped without retry')
        except Exception as e:
            cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2))
            raise
        last=time.monotonic();calls+=1
        cache[key]={'query':params,'results':matches,'checked_at':DATE}
        cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2))
    results[sk]=cache[key]

# Documentary source snapshots.
class Links(HTMLParser):
    def __init__(self):super().__init__();self.links=[];self.href=None;self.txt=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':
            self.href=dict(attrs).get('href');self.txt=[]
    def handle_data(self,d):
        if self.href:self.txt.append(d)
    def handle_endtag(self,tag):
        if tag=='a' and self.href:
            self.links.append((' '.join(self.txt).strip(),self.href));self.href=None;self.txt=[]

source_urls=[
 'https://www.aslroma5.it/amministrazione-trasparente/strutture-sanitarie-private-accreditate/',
 'https://www.cooperate.it/servizi/bracciano.html',
 'https://www.cooperate.it/servizi/bracciano/prestazioni.html',
 'https://www.nuoviorizzonti.org/contatti/',
 'https://www.nuoviorizzonti.org/trasparenza/',
 'https://www.alidelponte.com/servizi',
]
sources=[]
for u in source_urls:
    item={'url':u,'retrieved_at':DATE}
    try:
        rq=urllib.request.Request(u,headers={'User-Agent':UA})
        with urllib.request.urlopen(rq,timeout=35) as r:b=r.read();final=r.geturl();ctype=r.headers.get('Content-Type','')
        item.update(status=200,final_url=final,content_type=ctype,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b))
        ext='.pdf' if b.startswith(b'%PDF') else '.html'
        p=OUT/('source-'+hashlib.sha256(u.encode()).hexdigest()[:16]+ext);p.write_bytes(b);item['file']=p.name
        if ext=='.html':
            parser=Links();parser.feed(b.decode('utf-8','ignore'))
            wanted=[]
            terms=['Villa Elisa','Villa Letizia','Operiamo','Al Colle','Insieme','2025-2026','budget','contratto']
            for text,href in parser.links:
                full=urllib.parse.urljoin(final,href)
                if any(t.lower() in (text+' '+full).lower() for t in terms):
                    wanted.append({'text':text,'url':full})
            item['relevant_links']=wanted
    except Exception as e:item.update(status=0,error=str(e))
    sources.append(item)

# Follow only exact PDF links for the five unresolved Roma 5 units.
follow=[]
for s in sources:
    if 'aslroma5.it/amministrazione' in s['url']:
        for x in s.get('relevant_links',[]):
            low=(x['text']+' '+x['url']).lower()
            if any(n in low for n in ['villa-elisa','villa elisa','villa-letizia','villa letizia','operiamo','al-colle','al colle','insieme']) and '.pdf' in low:
                follow.append(x['url'])
for u in dict.fromkeys(follow):
    item={'url':u,'retrieved_at':DATE}
    try:
        rq=urllib.request.Request(u,headers={'User-Agent':UA})
        with urllib.request.urlopen(rq,timeout=45) as r:b=r.read();final=r.geturl()
        p=OUT/('doc-'+hashlib.sha256(u.encode()).hexdigest()[:16]+'.pdf');p.write_bytes(b)
        item.update(status=200,final_url=final,sha256=hashlib.sha256(b).hexdigest(),bytes=len(b),file=p.name)
    except Exception as e:item.update(status=0,error=str(e))
    sources.append(item)

(OUT/'geocode-results.json').write_text(json.dumps({'version':'7.9.2','requests_this_run':calls,'records':results},ensure_ascii=False,indent=2))
(OUT/'source-index.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2))
print(json.dumps({'candidate_services':len(results),'nominatim_requests':calls,'sources_ok':sum(s.get('status')==200 for s in sources),'sources_total':len(sources)},indent=2))

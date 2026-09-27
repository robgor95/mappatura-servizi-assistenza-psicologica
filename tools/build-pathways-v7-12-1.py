"""Build the approved pathway UX from a pinned baseline, never from clinical data.

Run only on the dedicated release branch. Output paths are recorded for a scoped
commit. Existing datasets, Menta analysis, maps, historical downloads and assets
are not edited. The generated HTML works without JavaScript.
"""
from pathlib import Path
import json
import subprocess
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
BASE = 'd57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb'
VERSION = '7.12.1'
WRITTEN = []

def original(path):
    return subprocess.check_output(['git', 'show', BASE + ':' + path], cwd=ROOT, text=True)

def write(path, text):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text.rstrip() + '\n', encoding='utf-8')
    WRITTEN.append(path)

def fragment(html):
    return BeautifulSoup(html, 'html.parser').find()

def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Expected one occurrence: ' + old[:120])
    return text.replace(old, new, 1)

inventory = json.loads(original('downloads/Audit_UX_V7_12.json'))
compass = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/></svg>'
search = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>'
choices = '''<div class="ux-choice-grid" aria-label="Due modi diversi per iniziare">
<article class="ux-choice-card ux-choice-guide" aria-labelledby="ux-guide-choice">
<div class="ux-choice-label">COMPASS<span>Orientamento con Menta</span></div>
<h2 id="ux-guide-choice">Non sai da dove iniziare?</h2>
<p>Menta ti aiuta a capire quali servizi e percorsi puoi esplorare.</p>
<div class="actions"><a class="button" href="/orientati.html">Aiutami a orientarmi <span aria-hidden="true">→</span></a></div>
</article>
<article class="ux-choice-card ux-choice-search" aria-labelledby="ux-search-choice">
<div class="ux-choice-label">SEARCH<span>Ricerca diretta</span></div>
<h2 id="ux-search-choice">Vuoi cercare un servizio?</h2>
<p>Consulta l’elenco per nome, comune o tipo di servizio e trova indirizzi e contatti.</p>
<div class="actions"><a class="button secondary" href="/servizi.html">Cerca servizi e strutture <span aria-hidden="true">→</span></a></div>
</article></div>'''.replace('COMPASS', compass).replace('SEARCH', search)
needs = '''<section class="ux-need-paths" aria-labelledby="ux-needs-title">
<h2 id="ux-needs-title">Scegli un punto di partenza</h2>
<p class="ux-need-hint">Apri un argomento per capire il percorso, poi scegli la sezione da visitare.</p>
<div class="ux-need-grid">
<details class="ux-need-path" name="orientation-needs" id="percorso-ascolto">
<summary><strong>Vorrei parlare con qualcuno</strong><span>Scopri le possibilità di ascolto</span></summary>
<div class="ux-need-body"><p>Puoi esplorare numeri utili e servizi di ascolto. Le loro funzioni e gli orari sono diversi da quelli dei numeri di emergenza.</p><a href="/ascolto.html">Esplora numeri utili e ascolto →</a></div>
</details>
<details class="ux-need-path" name="orientation-needs" id="percorso-studenti">
<summary><strong>Cerco supporto per uno studente</strong><span>Università, scuola e territorio</span></summary>
<div class="ux-need-body"><p>La sezione studenti distingue supporto universitario, sportelli scolastici e servizi fuori dal contesto di studio. Da lì puoi scegliere l’ambito che ti interessa.</p><a href="/studenti.html">Esplora i percorsi per studenti →</a></div>
</details>
<details class="ux-need-path" name="orientation-needs" id="percorso-servizi">
<summary><strong>Vorrei capire quali servizi esistono</strong><span>Funzioni e sigle spiegate</span></summary>
<div class="ux-need-body"><p>Leggi che cosa fanno i diversi servizi e come si distinguono. Potrai poi passare all’elenco per cercare strutture e contatti.</p><a href="/orientamento-servizi.html">Scopri che cosa fanno i servizi →</a></div>
</details>
</div></section>'''

for item in inventory['pages']:
    path = item['path']
    soup = BeautifulSoup(original(path), 'html.parser')
    soup.body['data-navigation-version'] = VERSION
    soup.body['data-ux-version'] = VERSION
    for a in soup.select('.ux-header a[href="/orientati.html"], .ux-footer a[href="/orientati.html"], .ux-section-nav a[href="/orientati.html"]'):
        a.string = 'Orientati con Menta'
    for script in soup.select('script[src="/assets/ux-ui-v7-12.js"]'):
        script['src'] = '/assets/ux-ui-v7-12-1.js'
    if path in ['index.html', 'orientati.html', 'servizi.html', 'archivio.html']:
        soup.head.append(fragment('<link rel="stylesheet" href="/assets/percorsi-v7-12-1.css"/>'))
    if path == 'index.html':
        hero = soup.select_one('.ux-hero')
        hero.select_one('.lede').string = 'Due modi per iniziare: capire a chi rivolgerti oppure consultare direttamente servizi e contatti.'
        hero.select_one('.ux-hero-copy .actions').decompose()
        note = hero.select_one('.ux-hero-note')
        if note:
            note.decompose()
        hero.append(fragment(choices))
    elif path == 'orientati.html':
        soup.title.string = 'Da dove posso iniziare? Orientati con Menta | Salute mentale Lazio'
        for tag in soup.select('meta[property="og:title"], meta[name="twitter:title"]'):
            tag['content'] = 'Da dove posso iniziare? Orientati con Menta'
        for tag in soup.select('meta[name="description"], meta[property="og:description"], meta[name="twitter:description"]'):
            tag['content'] = 'Parti dal bisogno: scopri percorsi di ascolto, supporto per studenti e funzioni dei servizi. Menta orienta, non fa diagnosi.'
        crumb = soup.select_one('.ux-breadcrumb [aria-current="page"]')
        if crumb:
            crumb.string = 'Orientati con Menta'
        copy = soup.select_one('.menta-home-copy')
        copy.select_one('.eyebrow').string = 'Orientamento con Menta'
        copy.select_one('h1').string = 'Da dove posso iniziare?'
        intro = copy.select_one('.menta-home-intro')
        intro.string = 'Parti dal supporto che cerchi, non da una sigla. Scegli un argomento o scrivi poche parole: Menta ti indica le sezioni e le guide da esplorare.'
        intro.insert_after(fragment(needs))
        form = soup.select_one('#menta-form')
        custom = fragment('<details class="ux-custom-need" id="orientation-custom"><summary>Preferisci scrivere? Indica il supporto che cerchi</summary><p>Bastano poche parole sull’argomento. Non inserire informazioni personali o dettagli sanitari.</p></details>')
        form.insert_before(custom)
        custom.append(form.extract())
        form.select_one('label[for="menta-query"]').string = 'Quale argomento vuoi esplorare?'
        form.select_one('#menta-query')['placeholder'] = 'Es. parlare con qualcuno, università…'
        form.select_one('#menta-submit').string = 'Mostra i percorsi'
        examples = soup.select_one('.menta-examples')
        if examples:
            custom.append(examples.extract())
        independent = soup.select_one('.menta-independent')
        independent.replace_with(fragment('<p class="menta-independent ux-direct-link">Cerchi già indirizzi o contatti? <a href="/servizi.html">Cerca servizi e strutture →</a></p>'))
        soup.select_one('#menta-results-title').string = 'Percorsi da esplorare'
        soup.select_one('#menta-reset').string = 'Esplora un altro argomento'
        soup.select_one('#percorsi-manuali > summary').string = 'Altri percorsi e strumenti del sito'
        for script in soup.select('script[src="/assets/menta-ui-v7-7.js"]'):
            script['src'] = '/assets/menta-ui-v7-12-1.js'
    elif path in ['servizi.html', 'archivio.html']:
        soup.title.string = 'Cerca servizi e strutture nel Lazio | Salute mentale Lazio'
        intro = soup.select_one('.svc-intro')
        intro.select_one('.eyebrow').string = 'Ricerca diretta · Elenco dei servizi'
        heading = intro.select_one('h1')
        heading.clear()
        heading.append('Cerca servizi e strutture')
        heading.append(soup.new_tag('br'))
        span = soup.new_tag('span'); span.string = 'nel Lazio'; heading.append(span)
        intro.select_one('.lede').string = 'Consulta l’elenco dei servizi censiti nel Lazio. Cerca per nome, comune o tipo di servizio e apri le schede con indirizzi e contatti.'
        hint = intro.select_one('.ux-search-hint')
        hint.replace_with(fragment('<p class="micro ux-search-hint">Non sai quale servizio cercare? <a href="/orientati.html">Orientati con Menta</a>.</p>'))
        soup.select_one('#svc-search-title').string = 'Cerca nell’elenco'
        soup.select_one('#svc-form button[type="submit"]').string = 'Cerca nell’elenco'
        for tag in soup.select('meta[property="og:title"], meta[name="twitter:title"]'):
            tag['content'] = 'Cerca servizi e strutture nel Lazio'
    elif path == 'documenti.html':
        section = fragment('<section class="callout" id="release-v7121"><h2>V7.12.1 · Orientarsi o cercare</h2><p>Due percorsi più riconoscibili: Menta parte dai bisogni e spiega le sezioni; la ricerca diretta mostra servizi, indirizzi e contatti. Dati geografici invariati.</p><p><a href="/downloads/Release_Notes_V7_12_1.md">Modifiche e limiti</a> · <a href="/downloads/Audit_Percorsi_V7_12_1.json">Ambito della verifica</a></p></section>')
        current = soup.select_one('#release-v712')
        if current:
            current.insert_before(section)
        else:
            soup.select_one('main').append(section)
    write(path, str(soup))

css = '''/* V7.12.1: distinguish orientation from directory search, also without JS. */
.ux-home .ux-hero{grid-template-columns:minmax(0,1fr) 220px;gap:20px 32px;padding:32px 36px}
.ux-home .ux-hero .lede{max-width:57ch;margin-bottom:0}
.ux-home .ux-mascot-frame .menta-figure{width:min(100%,185px)}
.ux-choice-grid{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ux-choice-card{display:flex;flex-direction:column;min-width:0;padding:20px 23px;border:1px solid #b5ccb0;border-radius:22px;background:#edf5e8}
.ux-choice-card.ux-choice-search{background:#fffefa;border-color:#c5c8b9}
.ux-choice-label{display:flex;align-items:center;gap:9px;color:#345b43;font-size:.77rem;font-weight:750;letter-spacing:.025em}
.ux-choice-label svg{width:23px;height:23px;flex:none}
.ux-choice-search .ux-choice-label{color:#6c4c30}
.ux-choice-card h2{font-size:1.32rem;line-height:1.3;margin:12px 0 8px;text-wrap:initial}
.ux-choice-card p{color:#435c50;font-size:.92rem;line-height:1.55;margin:0 0 15px}
.ux-home .ux-choice-card .actions{margin:auto 0 0;gap:0}
.ux-home .ux-choice-card .button{min-height:48px;max-width:100%;text-align:center;white-space:normal}
.ux-choice-search .button.secondary{border-color:#927453;color:#5b412c;background:#fffdf5}
.ux-choice-search .button.secondary:hover{background:#f5ebdc;color:#4a3422}
.ux-orientation .menta-home{grid-template-columns:minmax(0,1fr) 155px;gap:24px;align-items:start}
.ux-orientation .menta-home>.menta-welcome{width:145px;max-width:100%;align-self:start;padding:0;position:static}
.ux-orientation .menta-home-copy{min-width:0}
.ux-orientation .menta-home-intro{max-width:70ch}
.ux-need-paths{margin:24px 0 20px}
.ux-need-paths h2{font-size:1.3rem;margin:0 0 8px}
.ux-need-hint{font-size:.88rem;line-height:1.55;color:#435c50;margin:0 0 14px}
.ux-need-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}
.ux-need-path{border:1px solid #afc5a9;border-radius:18px;background:#fffefa;min-width:0}
.ux-need-path>summary{cursor:pointer;min-height:128px;padding:16px;list-style-position:inside;color:#244d3b}
.ux-need-path>summary strong{font-size:.97rem;line-height:1.45;font-weight:700}
.ux-need-path>summary span{display:block;font-size:.79rem;line-height:1.5;margin-top:8px;color:#506353}
.ux-need-path[open]{border-color:#5d8663;background:#f4f8ee}
.ux-need-path[open]>summary{min-height:0;border-bottom:1px solid #d4e0d1}
.ux-need-body{padding:14px 16px 16px;font-size:.88rem;line-height:1.6}
.ux-need-body p{margin:0 0 10px}
.ux-need-body a{display:inline-flex;align-items:center;min-height:44px;font-weight:650;overflow-wrap:anywhere}
.ux-custom-need{margin:18px 0;border:1px solid #bdcdb7;border-radius:18px;background:#fffefa;padding:0 18px}
.ux-custom-need>summary{cursor:pointer;min-height:52px;padding:14px 0;font-weight:650;font-size:.91rem;line-height:1.5}
.ux-custom-need>p{font-size:.86rem;line-height:1.6;margin:8px 0 16px}
.ux-custom-need form{margin:0 0 12px}.ux-custom-need .menta-input-row{display:flex;flex-wrap:wrap;gap:10px}.ux-custom-need .menta-input-row input{flex:1 1 210px;width:100%;min-width:0}.ux-custom-need .menta-input-row button{flex:0 1 auto;max-width:100%;white-space:normal}
.ux-custom-need .menta-examples{padding-bottom:16px}
.ux-orientation .menta-independent.ux-direct-link{display:block;border:0;padding:0;background:none;font-size:.86rem;line-height:1.65;margin:18px 0 0}
.ux-direct-link a{display:inline-block;padding-block:4px;min-height:32px}
.ux-orientation .menta-home-about{grid-column:1/-1}
.services-page.ux-shell .svc-intro{background:#fffdf5;border-color:#ccc7b4}
.services-page.ux-shell .svc-intro .eyebrow{color:#6c4c30}
.services-page.ux-shell .ux-search-hint{margin-top:8px}
@media(max-width:1000px){.ux-orientation .menta-home{grid-template-columns:minmax(0,1fr)}.ux-orientation .menta-home>.menta-welcome{display:none}.ux-home .ux-hero{grid-template-columns:minmax(0,1fr) 170px;padding:28px}.ux-home .ux-mascot-caption{font-size:.7rem;text-align:center}.ux-choice-card{padding:18px}.ux-choice-card h2{font-size:1.18rem}}
@media(max-width:620px){.ux-home .ux-hero{display:grid;grid-template-columns:minmax(0,1fr);padding:22px 18px;gap:20px;overflow:visible}.ux-home .ux-hero-copy{padding-top:0}.ux-home .ux-hero h1{font-size:2rem;max-width:none;padding-right:58px}.ux-home .ux-hero .eyebrow{max-width:calc(100% - 60px);margin-bottom:12px}.ux-home .ux-hero .lede{font-size:.95rem;line-height:1.6}.ux-home .ux-mascot-frame{position:absolute;width:67px;right:14px;top:29px;padding:0}.ux-home .ux-mascot-frame .menta-figure{width:67px}.ux-home .ux-mascot-frame:after,.ux-home .ux-mascot-caption{display:none}.ux-choice-grid{grid-template-columns:minmax(0,1fr);gap:12px}.ux-choice-card{padding:16px 18px}.ux-choice-card h2{font-size:1.16rem;margin:9px 0 6px}.ux-choice-card p{font-size:.87rem;margin-bottom:12px}.ux-home .ux-choice-card .button{width:100%;font-size:.88rem}.ux-choice-label{font-size:.73rem}.ux-need-grid{grid-template-columns:minmax(0,1fr)}.ux-need-path>summary{min-height:78px;padding:14px 16px}.ux-need-path>summary span{margin-top:4px}.ux-custom-need{padding-inline:14px}.ux-custom-need .menta-input-row button{width:100%}.ux-orientation .menta-home{padding:22px 18px}}
@media print{.ux-choice-grid,.ux-need-grid{display:block}.ux-choice-card,.ux-need-path{break-inside:avoid;margin-bottom:12px}.ux-need-path .ux-need-body{display:block!important}}
'''
write('assets/percorsi-v7-12-1.css', css)

ui = original('assets/ux-ui-v7-12.js')
old_block = "const home=location.pathname==='/'||location.pathname==='/index.html';"
ui = replace_once(ui, old_block, "const home=['/','/index','/index.html'].includes(location.pathname);")
old_block = "let currentHash='';try{currentHash=decodeURIComponent(location.hash.slice(1));}catch(_){}\n// Only known old homepage fragments are redirected; no search string or user-entered text is forwarded.\nif(home&&movedAnchors.has(currentHash)){location.replace('/orientati.html#'+encodeURIComponent(currentHash));return;}\nwindow.addEventListener('hashchange',()=>reveal(location.hash,false));"
new_block = "// Redirect only known fragments, initially and after same-document navigation.\n// Never forward the query string, form input or an arbitrary external target.\nfunction redirectMovedAnchor(){let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return false;}if(!home||!movedAnchors.has(id))return false;location.replace('/orientati.html#'+encodeURIComponent(id));return true;}\nif(redirectMovedAnchor())return;\nwindow.addEventListener('hashchange',()=>{if(!redirectMovedAnchor())reveal(location.hash,false);});"
ui = replace_once(ui, old_block, new_block)
ui = ui.replace("version:'7.12'", "version:'7.12.1'")
write('assets/ux-ui-v7-12-1.js', ui)
menta = original('assets/menta-ui-v7-7.js')
menta = menta.replace("'Potresti cercare…' : 'Un punto da cui partire'", "'Percorsi da esplorare' : 'Un percorso da esplorare'")
menta = menta.replace('Scegli il collegamento da aprire. Puoi sempre modificare i filtri o esplorare in autonomia.', 'Leggi la descrizione e apri il percorso. Potrai poi cercare strutture e contatti nell’elenco dei servizi.')
menta = menta.replace("'Apri con i filtri →' : 'Apri la sezione →'", "'Apri l’elenco dei servizi →' : 'Esplora il percorso →'")
write('assets/menta-ui-v7-12-1.js', menta)

manifest = json.loads(original('version.json'))
for field in ['web_version', 'ux_version', 'navigation_version']:
    manifest[field] = VERSION
manifest['release_note'] = 'V7.12.1: orientamento per bisogni distinto dalla ricerca diretta; homepage con due percorsi descritti, Menta con argomenti espandibili e scrittura facoltativa, compatibilità dei vecchi frammenti. Dataset e geografia V7.11.7 invariati.'
manifest['v7_12_1_verification'] = {'workflow': '.github/workflows/verify-ux-v7-12-1.yml', 'baseline_commit': BASE, 'scope': 'Dati, file protetti, navigazione, frammenti legacy, mobile, accessibilità automatica e confronto dei file realmente pubblicati. Consultare il run del commit; non riutilizzare gli esiti V7.12.'}
write('version.json', json.dumps(manifest, ensure_ascii=False, indent=2))
release = '''# V7.12.1 — Orientarsi oppure cercare

27 settembre 2026. Baseline: V7.12, commit d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb.

## Homepage
Due riquadri brevi distinguono prima del clic l’orientamento dalla ricerca:
- Non sai da dove iniziare? → Aiutami a orientarmi.
- Vuoi cercare un servizio? → Cerca servizi e strutture.
Ogni percorso ha una descrizione e un simbolo diverso. Restano i quattro accessi rapidi: mappa, ascolto, studenti e territorio. Nessun modulo o nuovo elenco denso in homepage.

## Menta
La pagina si apre con “Da dove posso iniziare?” e tre argomenti espandibili: parlare con qualcuno, supporto per studenti, capire quali servizi esistono. Ogni argomento spiega il percorso prima di proporre una sezione. La scrittura per parole chiave è facoltativa e separata; non è una chat, una diagnosi o una valutazione clinica. Le scelte native funzionano anche senza JavaScript. Tutti i percorsi precedenti rimangono disponibili.

## Ricerca diretta
La pagina “Cerca servizi e strutture nel Lazio” mantiene ricerca, filtri, risultati e schede. Un collegamento discreto permette di passare all’orientamento. Etichette coerenti anche nell’ingresso legacy archivio.html e nei menu comuni.

## Compatibilità
I vecchi frammenti della homepage sono gestiti sia al caricamento sia quando cambiano sulla pagina già aperta. Il collaudo riconosce la destinazione corretta con o senza estensione .html, senza confondere la normalizzazione URL dell’hosting con un malfunzionamento. Nessuna query o informazione inserita viene inoltrata nel reindirizzamento.

## Dati e limiti
Dati V7.11.7 invariati: 443 schede, 373 localizzate, 70 senza pin, 69 casi geografici nella coda di lavoro. Non sono sedi fisiche uniche. Nessuna variazione di classificazioni, contatti, numeri, coordinate o analisi per parole chiave di Menta. Nessuna nuova raccolta dati, localizzazione del dispositivo o caricamento automatico della mappa.
I test automatici non sostituiscono prove con utenti reali o una certificazione completa di accessibilità. Gli esiti di produzione vanno letti nel workflow del commit pubblicato.

## Ripristino
Checkpoint: checkpoint-v7-12-before-pathways-v7-12-1. La V7.12 e tutti i file storici restano conservati.
'''
write('downloads/Release_Notes_V7_12_1.md', release)
write('CHANGELOG.md', '## 7.12.1 — 2026-09-27\n\nOrientamento per bisogni e ricerca diretta distinti in homepage e nelle pagine di arrivo. Tre percorsi nativi in Menta, scrittura facoltativa, etichette coerenti e compatibilità dei frammenti della vecchia homepage. Dati e motori di ricerca/analisi invariati. Vedi `downloads/Release_Notes_V7_12_1.md`.\n\n' + original('CHANGELOG.md'))
write('README.md', '## Versione web 7.12.1 · Orientarsi oppure cercare\n\nDue percorsi espliciti: Menta per capire da dove partire; ricerca diretta per strutture, indirizzi e contatti. Dati/geografia V7.11.7 invariati. Verifiche: `.github/workflows/verify-ux-v7-12-1.yml`; note: `downloads/Release_Notes_V7_12_1.md`.\n\n' + original('README.md'))

data_test = original('tools/test-data-v7-12.cjs').replace("assert.equal(v.web_version,'7.12')", "assert.equal(v.web_version,'7.12.1')").replace("const report={version:'7.11.7'", "const report={version:'7.12.1'")
write('tools/test-data-v7-12-1.cjs', data_test)
verify = original('tools/verify-ux-v7-12.py')
verify = verify.replace("manifest['web_version']=='7.12'", "manifest['web_version']=='7.12.1'")
verify = verify.replace('UX version is 7.12;', 'UX version is 7.12.1;')
verify = verify.replace('assets/ux-ui-v7-12.js', 'assets/ux-ui-v7-12-1.js')
verify = verify.replace("'version':'7.12'", "'version':'7.12.1'")
verify = verify.replace("'assets/menta-design-v7-12.css','assets/ux-ui-v7-12-1.js','version.json'", "'assets/menta-design-v7-12.css','assets/ux-ui-v7-12-1.js','assets/percorsi-v7-12-1.css','assets/menta-ui-v7-12-1.js','assets/ux-polish-v7-12.css','assets/directory-v7-12.js','assets/directory-disclosure-v7-12.js','downloads/Release_Notes_V7_12_1.md','downloads/Audit_Percorsi_V7_12_1.json','version.json'")
extra_checks = """
# The complete pinned dataset and all historical files remain unchanged.
for p in subprocess.check_output(['git','ls-tree','-r','--name-only','d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb'],cwd=R,text=True).splitlines():
    if p.startswith(('data/','offline/','downloads/')):
        expected=subprocess.check_output(['git','show','d57a6df5a3683a6ca4a77dc6ed47b51c15a29fcb:'+p],cwd=R)
        check('V7.12 data/history preserved: '+p,(R/p).read_bytes()==expected)
check('Two explained home choices',len(parsed['index.html'].select('.ux-choice-card'))==2 and all(c.select_one('h2') and c.select_one('p') and c.select_one('a[href]') for c in parsed['index.html'].select('.ux-choice-card')))
check('Three native need pathways and optional free input',len(parsed['orientati.html'].select('.ux-need-path'))==3 and not parsed['orientati.html'].select_one('#orientation-custom').has_attr('open'))
check('Every native need pathway has explanation and destination',all(d.select_one('summary') and d.select_one('.ux-need-body p') and d.select_one('.ux-need-body a[href]') for d in parsed['orientati.html'].select('.ux-need-path')))
check('Only presentation labels changed in Menta UI',(R/'assets/menta-ui-v7-12-1.js').read_text().replace('Percorsi da esplorare','Potresti cercare…').replace('Un percorso da esplorare','Un punto da cui partire').replace('Leggi la descrizione e apri il percorso. Potrai poi cercare strutture e contatti nell’elenco dei servizi.','Scegli il collegamento da aprire. Puoi sempre modificare i filtri o esplorare in autonomia.').replace('Apri l’elenco dei servizi →','Apri con i filtri →').replace('Esplora il percorso →','Apri la sezione →').strip()==(R/'assets/menta-ui-v7-7.js').read_text().strip())
"""
verify = replace_once(verify, 'if opts.production:', extra_checks + '\nif opts.production:')
write('tools/verify-ux-v7-12-1.py', verify)

tests = original('tools/test-ui-final-v7-12.mjs')
tests = tests.replace("version:'7.12'", "version:'7.12.1'")
tests = replace_once(tests, "await go(p,'orientati.html');await p.locator('#menta-query:not([disabled])').waitFor();", "await go(p,'orientati.html');await p.locator('#orientation-custom > summary').click();await p.locator('#menta-query:not([disabled])').waitFor();")
lines = tests.splitlines()
for i, line in enumerate(lines):
    if "await test('Old homepage Menta anchor opens" in line:
        lines[i] = " await test('Old homepage Menta anchor opens the actual orientation route',async()=>{const {c,p}=await context();await go(p,'index.html#menta');await p.waitForURL(u=>['/orientati','/orientati.html'].includes(u.pathname)&&u.hash==='#menta');assert(await p.locator('#menta').isVisible());assert.match(await p.locator('#menta-title').innerText(),/Da dove posso iniziare/);await c.close();});"
tests = '\n'.join(lines)
new_tests = r'''
 await test('Home distinguishes purpose with visible copy, not color alone',async()=>{const {c,p}=await context();await go(p,'index.html');const cards=p.locator('.ux-choice-card');assert.equal(await cards.count(),2);assert.match(await cards.nth(0).innerText(),/Non sai da dove iniziare/);assert.match(await cards.nth(0).innerText(),/Aiutami a orientarmi/);assert.match(await cards.nth(1).innerText(),/indirizzi e contatti/);assert.equal(await cards.nth(0).locator('a').getAttribute('href'),'/orientati.html');assert.equal(await cards.nth(1).locator('a').getAttribute('href'),'/servizi.html');await c.close();});
 await test('Orientation starts from needs while the directory starts from filters',async()=>{const {c,p}=await context();await go(p,'orientati.html');assert.equal(await p.locator('.ux-need-path').count(),3);assert.equal(await p.locator('#orientation-custom').getAttribute('open'),null);assert.equal(await p.locator('#menta-query').isVisible(),false);assert.equal(await p.locator('#svc-form').count(),0);await go(p,'servizi.html');assert.match(await p.locator('#svc-title').innerText(),/Cerca servizi e strutture/);assert(await p.locator('#svc-q').isVisible());assert.equal(await p.locator('.ux-need-path').count(),0);await c.close();});
 await test('Native need paths explain destinations and work without JavaScript',async()=>{const {c,p}=await context(390,false);await go(p,'orientati.html');for(const [id,href] of [['percorso-ascolto','/ascolto.html'],['percorso-studenti','/studenti.html'],['percorso-servizi','/orientamento-servizi.html']]){const d=p.locator('#'+id);await d.locator('summary').click();assert(await d.locator('.ux-need-body p').isVisible());assert(await d.locator('a[href="'+href+'"]').isVisible());await d.locator('summary').click();}await c.close();});
 await test('Expanded needs and optional input stay accessible at 320px',async()=>{const {c,p}=await context(320);await go(p,'orientati.html');await p.locator('#percorso-studenti > summary').click();await p.locator('#orientation-custom > summary').click();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();assert.equal(a.violations.length,0,JSON.stringify(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))));await c.close();});
 await test('Legacy root fragments redirect after the homepage is already open',async()=>{const {c,p}=await context();await go(p,'');await p.evaluate(()=>{location.hash='menta';});await p.waitForURL(u=>['/orientati','/orientati.html'].includes(u.pathname)&&u.hash==='#menta');assert(await p.locator('#ux-needs-title').isVisible());await c.close();});
 await test('Old field fragment reveals optional input without forwarding queries',async()=>{const {c,p}=await context();await go(p,'index.html?q=synthetic-private-marker#menta-query');await p.waitForURL(u=>['/orientati','/orientati.html'].includes(u.pathname)&&u.hash==='#menta-query');assert.equal(new URL(p.url()).search,'');assert(await p.locator('#menta-query').isVisible());assert.equal(await p.locator('#menta-query').inputValue(),'');await c.close();});
 await test('Unrecognized home fragments never cause an arbitrary redirect',async()=>{const {c,p}=await context();await go(p,'index.html#not-a-route');assert(await p.locator('.ux-choice-grid').isVisible());assert.equal(new URL(p.url()).hash,'#not-a-route');await c.close();});
 await test('Legacy directory keeps the same explicit search purpose',async()=>{const {c,p}=await context();await go(p,'archivio.html');assert.match(await p.locator('#svc-title').innerText(),/Cerca servizi e strutture/);assert.match(await p.locator('#svc-count').innerText(),/443/);await c.close();});
'''
tests = replace_once(tests, " await test('No unhandled JavaScript errors across reviewed pages'", new_tests + "\n await test('No unhandled JavaScript errors across reviewed pages'")
write('tools/test-ui-v7-12-1.mjs', tests)

report = {'version': VERSION, 'baseline_commit': BASE, 'date': '2026-09-27', 'pages': [p['path'] for p in inventory['pages']], 'main_pages': ['index.html','orientati.html','servizi.html','archivio.html'], 'clinical_data_changed': False, 'coordinate_changes': 0, 'menta_analysis_changed': False, 'home_routes': 6, 'native_need_paths': 3, 'verification_workflow': '.github/workflows/verify-ux-v7-12-1.yml', 'verification_status': 'Read the workflow for the exact commit; no test outcome is asserted by this build manifest.', 'limitations': ['No real-user usability study performed.', 'Automatic accessibility checks are not complete certification.'], 'rollback_checkpoint': 'checkpoint-v7-12-before-pathways-v7-12-1'}
write('downloads/Audit_Percorsi_V7_12_1.json', json.dumps(report, ensure_ascii=False, indent=2))
Path('/tmp/v7121-generated.txt').write_text('\n'.join(WRITTEN) + '\n')
print(json.dumps({'version': VERSION, 'generated_paths': WRITTEN}, indent=2))

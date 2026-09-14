"""Chromium integration checks. Run from any directory:
python tools/qa_v5.py --offline --output /tmp/sf-qa
Or use --url http://localhost:8080/?test to check real module/asset HTTP loading.
Requires playwright; --chromium selects an installed Chromium executable.
The offline mode preserves ES modules, rewriting only URLs to in-memory blobs.
"""
from __future__ import annotations
import argparse, base64, json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def boot(page, url: str | None = None):
    print('Booting',flush=True)
    if url:
        page.goto(url, wait_until='domcontentloaded')
    else:
        html = (ROOT/'index.html').read_text()
        html = re.sub(r'<script\b[^>]*>[\s\S]*?</script>', '', html)
        html = re.sub(r'<link[^>]+rel="stylesheet"[^>]*>', '', html)
        html = html.replace('</head>', '<style>'+(ROOT/'ui-v5.css').read_text()+'</style></head>')
        page.set_content(html)
        print('DOM ready',flush=True)
        page.on('console',lambda m:print(m.type,m.text,flush=True))
        page.evaluate('window.__files={}')
        roster = json.loads((ROOT/'tools/roster-v5.json').read_text())
        for definition in roster:
            if 'source' in definition:
                src = definition['source']
                print('Embed',src,flush=True)
                value = 'data:image/png;base64,' + base64.b64encode((ROOT/src).read_bytes()).decode()
                page.evaluate('([k,v])=>window.__files[k]=v', [src, value])
        for path in sorted((ROOT/'assets').glob('*-atlas-*.js')):
            page.add_script_tag(content=path.read_text())
        files = {name:(ROOT/name).read_text() for name in ['matte-part-0.js','matte-part-1.js','matte-part-2.js','matte-part-3.js','matte-v5.js','sprites-v5.js','arena-v5.js','app-v5.js']}
        files['sprites-v5.js'] = files['sprites-v5.js'].replace('new URL(def.source,import.meta.url).href', 'window.__files[def.source]')
        roster_url = 'data:application/json;base64,' + base64.b64encode((ROOT/'tools/roster-v5.json').read_bytes()).decode()
        files['app-v5.js'] = files['app-v5.js'].replace("new URL('./tools/roster-v5.json',import.meta.url)", json.dumps(roster_url)).replace("new URLSearchParams(location.search).has('test')", 'true')
        print('Import modules',flush=True)
        page.evaluate('''async files=>{
          const urls={};
          for(const [name,original] of Object.entries(files)){
            let code=original;
            for(const [dependency,url] of Object.entries(urls))code=code.replaceAll('./'+dependency,url);
            urls[name]=URL.createObjectURL(new Blob([code],{type:'text/javascript'}));
          }
          await import(urls['app-v5.js']);
        }''', files)
    page.wait_for_function('window.SF && SF.roster().length===18', timeout=90000)
    return page

def extract(page, output: Path):
    output.mkdir(parents=True, exist_ok=True)
    records = page.evaluate('''()=>Array.from(SF_TEST.assets.values()).filter(a=>a.status==='ready').map(a=>{
      const names=['idle','walk','punch','kick','jump','crouch','special','hurt','block','fall','getup','victory'];
      const canvas=document.createElement('canvas');canvas.width=800;canvas.height=names.length*135;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#25314c';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.font='12px monospace';
      names.forEach((name,i)=>{ctx.fillStyle='#fff';ctx.fillText(a.def.name+' / '+name,8,i*135+14);a.frames[name].forEach((f,j)=>{const s=f.scale;ctx.imageSmoothingEnabled=false;ctx.drawImage(f.canvas,65+j*128-f.px*s,i*135+129-f.py*s,f.canvas.width*s,f.canvas.height*s);});});
      return {id:a.def.id,rects:Object.fromEntries(names.map(n=>[n,a.frames[n].map(f=>f.sourceRect)])),png:canvas.toDataURL()};
    })''')
    for record in records:
        (output/(record['id']+'-frames.png')).write_bytes(base64.b64decode(record['png'].split(',')[1]))
        (output/(record['id']+'-rects.json')).write_text(json.dumps(record['rects']))

def run(args):
    results=[]; output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    def check(name, condition):
        if not condition: raise AssertionError(name)
        results.append(name);print('PASS',name,flush=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=args.chromium,headless=True,args=['--no-sandbox','--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows'])
        page=browser.new_page(viewport={'width':1440,'height':1080},device_scale_factor=1)
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        boot(page,args.url)
        check('All 18 fighters load',all(d['status']=='ready' for d in page.evaluate('SF.roster()')))
        if args.extract:
            extract(page,output);browser.close();return
        check('All frames have nonempty canvases',page.evaluate('Array.from(SF_TEST.assets.values()).every(a=>Object.values(a.frames).every(g=>g.every(f=>f.canvas.width>10&&f.canvas.height>10)))'))
        for d in page.evaluate('SF.roster()'):
            page.click('[data-slot="0"]');page.click('.fighter-card[data-id="'+d['id']+'"]')
            check('Select '+d['name'],page.evaluate('SF.selection().ids[0]')==d['id'])
        page.fill('#fighterSearch','yoga');check('Search filters roster',page.locator('.fighter-card:visible').count()==1);page.fill('#fighterSearch','')
        page.click('[data-slot="0"]');page.click('.fighter-card[data-id="douchebag-dave"]');page.click('[data-slot="1"]');page.click('.fighter-card[data-id="bimbo-babe"]')
        page.click('[data-mode="local"]');page.click('#startButton');page.wait_for_timeout(1750)
        check('Local match starts',page.evaluate('SF.snapshot().phase')=='fight')
        x=page.evaluate('SF.snapshot().people[0].x');page.keyboard.down('KeyD');page.wait_for_timeout(140);page.keyboard.up('KeyD');check('Move with keyboard',page.evaluate('SF.snapshot().people[0].x')>x)
        page.keyboard.press('KeyW');page.wait_for_timeout(140);check('Jump uses airborne pose',page.evaluate("SF.snapshot().people[0].y<430&&SF.snapshot().people[0].state==='jump'"))
        page.wait_for_timeout(800);page.keyboard.down('KeyS');page.wait_for_timeout(70);check('Crouch has dedicated state',page.evaluate("SF.snapshot().people[0].state==='crouch'"));page.keyboard.up('KeyS')
        page.keyboard.press('KeyP');t=page.evaluate('SF.snapshot().remaining');page.wait_for_timeout(150);check('Pause freezes clock',page.evaluate('SF.snapshot().paused&&SF.snapshot().remaining')==t);page.keyboard.press('KeyP')
        check('Punch damages and block reduces damage',page.evaluate('''()=>{const g=SF_TEST.arena;g.reset();g.phase='fight';g.people[0].x=400;g.people[1].x=480;g.key('KeyF',true);for(let i=0;i<38;i++)g.update();g.key('KeyF',false);const normal=100-g.people[1].hp;g.reset();g.phase='fight';g.people[0].x=400;g.people[1].x=480;g.key('KeyI',true);g.update();g.key('KeyF',true);for(let i=0;i<38;i++)g.update();g.key('KeyF',false);g.key('KeyI',false);return normal===8&&(100-g.people[1].hp)<normal&&!g.people[0].action;}'''))
        check('Special knocks down and gets up once',page.evaluate('''()=>{const g=SF_TEST.arena;g.reset();g.phase='fight';g.people[0].x=400;g.people[1].x=520;g.key('KeyH',true);let states=new Set();for(let i=0;i<100;i++){g.update();states.add(g.people[1].state)}g.key('KeyH',false);return states.has('fall')&&states.has('getup')&&g.people[1].state==='idle';}'''))
        check('KO scores once per round',page.evaluate('''()=>{const g=SF_TEST.arena;g.reset();g.wins=[0,0];g.round=1;g.phase='fight';g.people[1].hp=0;for(let i=0;i<20;i++)g.update();const first=g.wins[0]===1;for(let i=0;i<115;i++)g.update();return first&&g.wins[0]===1&&g.round===2;}'''))
        check('Match ends at two wins',page.evaluate('''()=>{const g=SF_TEST.arena;g.phase='fight';g.people[1].hp=0;for(let i=0;i<150;i++)g.update();return g.phase==='matchover'&&g.wins[0]===2;}'''))
        page.click('#resultMenu');check('Return to select works',page.locator('#selectScreen').is_visible());page.screenshot(path=str(output/'selector-desktop.png'),full_page=True)
        page.click('#labButton');page.select_option('#labSequence','walk');page.wait_for_function("document.getElementById('labInfo').textContent.includes('FRAME')",timeout=5000);check('Animation lab opens','FRAME' in page.inner_text('#labInfo'));page.click('#labStep');check('Single frame step pauses playback',page.get_attribute('#labPlay','aria-pressed')=='false');page.locator('#labDialog .close').click()
        page.click('[data-mode="training"]');page.click('#startButton');page.wait_for_timeout(120);check('Practice unlimited timer and meter',page.inner_text('#clock')=='\u221e' and page.evaluate('SF.snapshot().people[0].meter')==100)
        page.keyboard.press('KeyR');check('Practice reset works',page.evaluate('SF.snapshot().people[0].hp')==100)
        page.screenshot(path=str(output/'match-v5.png'),full_page=True)
        page.click('#backButton');page.click('#menuButton');page.click('[data-mode="cpu"]')
        page.screenshot(path=str(output/'selector-desktop.png'),full_page=True)
        for width in [390,768,1024]:
            page.set_viewport_size({'width':width,'height':844});page.wait_for_timeout(100)
            check('No horizontal overflow at '+str(width),page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
            check('Start reachable at '+str(width),page.locator('#startButton').is_enabled())
            page.screenshot(path=str(output/('selector-'+str(width)+'.png')),full_page=True)
        check('No JS exceptions',not errors)
        browser.close()
    (output/'results.json').write_text(json.dumps({'passed':len(results),'checks':results,'errors':errors,'mode':'HTTP' if args.url else 'offline ES modules'},indent=2))
    print('TOTAL',len(results))
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--offline',action='store_true');parser.add_argument('--url');parser.add_argument('--output',default='/tmp/sf-qa');parser.add_argument('--chromium',default='/usr/bin/chromium');parser.add_argument('--extract',action='store_true')
    run(parser.parse_args())

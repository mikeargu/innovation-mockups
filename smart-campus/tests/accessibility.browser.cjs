// Contrast and interaction audit adapted from the existing local Tec Conect QA harness.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const entry = path.join(root, 'index.html');
assert.ok(fs.existsSync(entry), 'Smart Campus entry screen is not implemented');
const { chromium } = require('playwright');
const D = require('../data.js');
const base = process.env.SC_URL || 'file://' + entry;
const executablePath = process.env.SC_CHROMIUM || (fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : chromium.executablePath());
function inspect({minTarget,minText}){
 const describe=el=>{const id=el.id?'#'+el.id:'';const cls=typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';return el.tagName.toLowerCase()+id+cls;};
 const TRANSPARENT=/^(transparent|rgba\(0, 0, 0, 0\))$/;
 function parse(value){
  let m=value.match(/^rgba?\(([^)]+)\)$/);
  if(m){const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1};}
  m=value.match(/^color\(srgb ([^)]+)\)$/);
  if(m){const p=m[1].split(/[ \/]+/).filter(Boolean).map(Number);return{r:p[0]*255,g:p[1]*255,b:p[2]*255,a:p.length>3?p[3]:1};}
  return null;
 }
 const colorsIn=text=>(text.match(/rgba?\([^)]+\)|color\(srgb [^)]+\)/g)||[]).map(parse);
 const blend=(top,bottom)=>({r:top.r*top.a+bottom.r*(1-top.a),g:top.g*top.a+bottom.g*(1-top.a),b:top.b*top.a+bottom.b*(1-top.a),a:1});
 const lum=c=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);};return 0.2126*f(c.r)+0.7152*f(c.g)+0.0722*f(c.b);};
 const ratio=(a,b)=>{const l1=lum(a),l2=lum(b);return(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);};
 const hidden=el=>{for(let n=el;n&&n.nodeType===1;n=n.parentElement){const cs=getComputedStyle(n);if(n.getAttribute('aria-hidden')==='true'||cs.display==='none'||cs.visibility==='hidden'||n.hidden)return true;if(n.classList.contains('sr-only')||n.classList.contains('skip-link'))return true;}const r=el.getBoundingClientRect();return r.width<1||r.height<1;};
 const disabled=el=>!!el.closest('[disabled],[aria-disabled="true"]');
 const contrast=[],small=[],targets=[],icons=[],statuses=[],unparsed=[],unchecked=[];
 // Returns the candidate backdrops behind an element: one solid colour, or one per gradient stop.
 function backdrops(el){
  const layers=[];
  for(let n=el;n&&n.nodeType===1;n=n.parentElement){
   const cs=getComputedStyle(n);
   if(cs.backgroundImage&&cs.backgroundImage!=='none'){
    if(!/gradient/.test(cs.backgroundImage))return{unknown:true};
    const stops=colorsIn(cs.backgroundImage);
    if(stops.some(stop=>!stop)){unparsed.push(describe(n)+' background-image');return{unknown:true};}
    return{colors:stops.map(stop=>layers.reduceRight((acc,layer)=>blend(layer,acc),blend(stop,{r:255,g:255,b:255,a:1})))};
   }
   if(!TRANSPARENT.test(cs.backgroundColor)){
    const c=parse(cs.backgroundColor);
    if(!c){unparsed.push(describe(n)+' background '+cs.backgroundColor);return{unknown:true};}
    layers.push(c);if(c.a>=1)break;
   }
  }
  let solid={r:255,g:255,b:255,a:1};for(let i=layers.length-1;i>=0;i--)solid=blend(layers[i],solid);
  return{colors:[solid]};
 }
 function check(el,colorValue,size,weight,label){
  const fgRaw=parse(colorValue);if(!fgRaw){unparsed.push(describe(el)+' color '+colorValue);return;}
  const back=backdrops(el);if(back.unknown){unchecked.push(describe(el));return;}
  let opacity=1;for(let n=el;n&&n.nodeType===1;n=n.parentElement)opacity*=parseFloat(getComputedStyle(n).opacity);
  const fg={...fgRaw,a:fgRaw.a*opacity};
  const worst=Math.min(...back.colors.map(bg=>ratio(blend(fg,bg),bg)));
  const large=size>=24||(size>=18.66&&weight>=700);
  if(!(worst>=(large?3:4.5)))contrast.push(describe(el)+' '+worst.toFixed(2)+':1 at '+size+'px «'+label.slice(0,30)+'»');
 }
 const textEls=[...document.querySelectorAll('body *')].filter(el=>[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&!el.closest('svg'));
 for(const el of textEls){
  if(hidden(el)||disabled(el))continue;
  const cs=getComputedStyle(el);const size=parseFloat(cs.fontSize);const weight=parseInt(cs.fontWeight,10);
  if(size<minText)small.push(describe(el)+' '+size+'px');
  check(el,cs.color,size,weight,el.textContent.trim());
 }
 for(const el of document.querySelectorAll('input:not([type=radio]):not([type=checkbox]),select,textarea')){if(!hidden(el)&&!disabled(el)&&parseFloat(getComputedStyle(el).fontSize)<16)small.push(describe(el)+' field below16px');}
 for(const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')){
  if(hidden(el)||disabled(el)||!el.placeholder)continue;
  const ph=getComputedStyle(el,'::placeholder');
  check(el,ph.color,parseFloat(ph.fontSize),parseInt(ph.fontWeight,10),'placeholder: '+el.placeholder);
 }
 const interactive=[...document.querySelectorAll('a[href],button,select,textarea,input:not([type=hidden]),[role=button],[tabindex="0"]')];
 for(const el of interactive){
  if(hidden(el)&&!(el.matches('input[type=checkbox],input[type=radio]')&&el.closest('label')))continue;
  if(el.matches('.directory-scroll'))continue;
  let box=el.getBoundingClientRect();
  if(el.matches('input[type=checkbox],input[type=radio]')&&el.closest('label'))box=el.closest('label').getBoundingClientRect();
  const cs=getComputedStyle(el);
  // Only links inside running text are exempt (WCAG 2.5.8 inline exception).
  const parent=el.parentElement;
  const siblingText=[...parent.childNodes].filter(n=>n!==el&&n.nodeType===3).map(n=>n.textContent.trim()).join(' ');
  const inline=el.tagName==='A'&&cs.display==='inline'&&parent.matches('p,li,dd,span,small,label')&&siblingText.replace(/[^\p{L}\p{N}]/gu,'').length>3;
  if(inline)continue;
  if(box.height<minTarget-0.5||box.width<minTarget-0.5)targets.push(describe(el)+' '+Math.round(box.width)+'×'+Math.round(box.height)+' «'+(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,24)+'»');
 }
 for(const el of document.querySelectorAll('.icon,.symbol')){if(!getComputedStyle(el).fontFamily.includes('Material Symbols Rounded'))icons.push(describe(el));}
 for(const el of document.querySelectorAll('.status')){if(hidden(el))continue;const hasIcon=!!el.querySelector('.icon');const text=[...el.childNodes].filter(n=>!(n.nodeType===1&&n.classList.contains('icon'))).map(n=>n.textContent).join('').trim();if(!text)statuses.push(describe(el));}
 return{contrast,small,targets,icons,statuses,unparsed,unchecked};
}


(async () => {
  const browser = await chromium.launch({headless:true, executablePath});
  const results = []; const failures = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => failures.push({runtime:e.message}));
    const routes = ['#/explore','#/library','#/library/library-room-6/book','#/library/library-room-6/review','#/gym/gym-profesional','#/gym/gym-prepatec','#/gym/gym-profesional/scan','#/gym/gym-prepatec/scan','#/gym/gym-profesional/attendance','#/assistant','#/profile','#/activity/reservations','#/activity/attendance','#/activity/favorites','#/activity/history',...D.spaces.map(s=>'#/space/'+s.id),'#/space/lab-3d/access'];
    const settle = async () => { await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))); await page.waitForFunction(()=>document.querySelector('main h1')); await page.evaluate(()=>document.fonts.ready); };
    const audit = async (width, route) => {
      await page.waitForFunction(()=>{const toast=document.getElementById('toast');return !toast.classList.contains('show')||getComputedStyle(toast).opacity==='1';});
      const found = await page.evaluate(inspect,{minTarget:44,minText:12});
      results.push({width,route,...found});
      if (Object.values(found).some(items => items.length)) failures.push({width,route,...found});
    };
    const click = async name => { await page.getByRole('button',{name,exact:true}).click(); await settle(); };
    await page.goto(base);
    for (const width of [360,390,430]) {
      await page.setViewportSize({width,height:844});
      for (const route of routes) {
        await page.evaluate(hash => {location.hash=hash;},route);
        await settle();
        await audit(width, route);
      }
      // Stateful gym journey: scan error, verified form, running session (page, gym banner, activity) and finished session.
      await page.evaluate(()=>{location.hash='#/gym/gym-profesional/scan';}); await settle();
      await click('Probar con el QR del otro gimnasio'); await audit(width,'scan · wrong-gym error');
      await click('Simular escaneo del QR de entrada'); await audit(width,'form · arrival verified');
      await click('Registrar'); await audit(width,'session · active');
      await page.evaluate(()=>{location.hash='#/gym/gym-profesional';}); await settle(); await audit(width,'gym · active banner');
      await page.evaluate(()=>{location.hash='#/activity/attendance';}); await settle(); await audit(width,'activity · active session');
      await page.locator('.activity-card.live').click(); await settle();
      await click('Demo · simular fin del tiempo'); await audit(width,'session · finished');
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.evaluate(()=>{location.hash='#/gym/gym-profesional/scan';}); await settle();
    const motion = await page.evaluate(()=>[...document.querySelectorAll('.scanner-line,.live-dot')].map(node=>getComputedStyle(node).animationName));
    if (motion.some(name => name !== 'none')) failures.push({route:'reduced motion',motion});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:390,height:844});
    for (const route of ['#/explore','#/library/library-room-6/book','#/gym/gym-profesional','#/gym/gym-profesional/scan','#/gym/gym-profesional/attendance','#/assistant','#/profile']) {
      await page.evaluate(hash=>{location.hash=hash;},route);
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await page.waitForFunction(()=>document.querySelector('main h1'));
      await page.mouse.click(1,1);
      const count = await page.locator('a[href],button,select,textarea,input:not([type=hidden])').count();
      const seen = new Set();
      for(let step=0;step<Math.min(count+4,70);step++){
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(()=>{
          const el=document.activeElement;
          if(!el||el===document.body||el===document.querySelector('main'))return null;
          const ring=el.matches('input[type=radio]')&&el.closest('label')?el.closest('label'):el;
          const look=()=>{const cs=getComputedStyle(ring);return cs.outlineStyle+cs.outlineWidth+cs.outlineColor+cs.boxShadow+cs.borderColor;};
          const focused=look();el.blur();const blurred=look();el.focus();
          return {name:el.id||el.getAttribute('aria-label')||el.textContent.trim().slice(0,40),visible:focused!==blurred};
        });
        if(focus&&!seen.has(focus.name)){seen.add(focus.name);if(!focus.visible)failures.push({route,focus:focus.name});}
      }
    }
    const report={status:failures.length?'FAIL':'PASS',states:results.length,focusRoutes:7,reducedMotion:true,failures,results};
    fs.mkdirSync(path.join(root,'review'),{recursive:true});
    fs.writeFileSync(path.join(root,'review','accessibility-results.json'),JSON.stringify(report,null,2));
    if(failures.length){console.error(JSON.stringify(failures.slice(0,15),null,2));process.exitCode=1;}
    else console.log('PASS: contrast, text size, 44px targets, icon font and textual states across '+results.length+' route/width states; visible keyboard focus on 7 key routes; scanner and live indicators stop under reduced motion.');
  } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

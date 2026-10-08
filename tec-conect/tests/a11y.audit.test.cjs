// Accessibility and brand audit across every route and the key interactive states.
// Fails on: text and placeholder contrast below WCAG AA (checked against solid backgrounds and
// every gradient stop), unparseable colours, touch targets under 44 px, focus that looks the same
// as the unfocused control, icons outside Material Symbols Rounded, status labels that rely on
// colour alone, text below 12 px, and runtime errors. Image backgrounds are reported as unchecked.
const{chromium}=require('playwright');
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const MIN_TARGET=44, MIN_TEXT=12, MAX_TAB_STEPS=220;
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
const routes=['#/pulse','#/pulse/laboratorio-ideas','#/pulse/laboratorio-ideas/register','#/pulse/huerto','#/pulse/practica-finanzas','#/pulse/practica-finanzas/apply',
 '#/talent','#/talent/lucia-torres','#/talent/lucia-torres/contact','#/mentor','#/mentor/plan','#/mentor/elena-cruz','#/mentor/paula-ortiz/request',
 '#/profile','#/profile/edit','#/profile/preferences'];
const states=[
 {name:'talent-result',run:async page=>{await nav(page,'#/talent');await page.locator('#assistant-chip-running-gels').click();await settle(page);await page.getByRole('button',{name:'Encontrar mi equipo',exact:true}).click();await settle(page);}},
 {name:'mentor-plan',run:async page=>{await nav(page,'#/mentor');await page.locator('#career-chip-stock-market').click();await settle(page);await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).click();await settle(page);await settle(page);await page.locator('#alt-button-exchange').click();await settle(page);}},
 {name:'register-confirmed',run:async page=>{await nav(page,'#/pulse/prototipo/register');await page.getByRole('button',{name:'Confirmar registro'}).click();await settle(page);}},
 {name:'apply-error',run:async page=>{await nav(page,'#/pulse/practica-finanzas/apply');await page.getByRole('button',{name:'Confirmar postulación'}).click();await settle(page);}},
 {name:'source-article',url:'demo-source.html?type=article&id=huerto'},
 {name:'source-job',url:'demo-source.html?type=job&id=practica-finanzas'}
];

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
 for(const el of document.querySelectorAll('.icon')){if(!getComputedStyle(el).fontFamily.includes('Material Symbols Rounded'))icons.push(describe(el));}
 for(const el of document.querySelectorAll('.status,.pulse-status')){if(hidden(el))continue;const hasIcon=!!el.querySelector('.icon');const text=[...el.childNodes].filter(n=>!(n.nodeType===1&&n.classList.contains('icon'))).map(n=>n.textContent).join('').trim();if(!hasIcon||!text)statuses.push(describe(el));}
 return{contrast,small,targets,icons,statuses,unparsed,unchecked};
}

// Tabs through every focusable control and requires the focused look to differ from the blurred look.
async function focusAudit(page){
 const failures=[];
 const steps=Math.min(MAX_TAB_STEPS,5+await page.evaluate(()=>[...document.querySelectorAll('a[href],button,select,textarea,input:not([type=hidden]),[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length).length));
 await page.evaluate(()=>{document.activeElement&&document.activeElement.blur();window.scrollTo(0,0);});
 await page.mouse.click(1,1);
 const seen=new Set();
 for(let i=0;i<steps;i++){
  await page.keyboard.press('Tab');
  const info=await page.evaluate(()=>{
   const el=document.activeElement;if(!el||el===document.body)return null;
   const ring=el.closest('.search-field')||el;
   const look=()=>{const cs=getComputedStyle(ring);return [cs.outlineStyle==='none'?'none':cs.outlineStyle+' '+cs.outlineWidth+' '+cs.outlineColor,cs.boxShadow,cs.borderColor].join('|');};
   const focused=look();el.blur();const blurred=look();el.focus();
   const id=el.id?'#'+el.id:'';const cls=typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'';
   return{ok:focused!==blurred,name:el.tagName.toLowerCase()+id+cls};
  });
  if(!info)continue;
  if(seen.has(info.name)&&i>steps/2)break;
  seen.add(info.name);
  if(!info.ok)failures.push(info.name);
 }
 return[...new Set(failures)];
}

(async()=>{
 const browser=await chromium.launch(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{});
 const report={};let pages=0;
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'#/pulse');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);
   const targets=[...routes.map(hash=>({name:hash,run:async p=>{await p.goto(base+'index.html');await p.locator('main h1').waitFor();await nav(p,hash);}})),...states];
   for(const target of targets){
    if(target.url){await page.goto(base+target.url);await page.locator('h1').first().waitFor();}
    else await target.run(page);
    await page.evaluate(()=>document.fonts.ready);await settle(page);
    const result=await page.evaluate(inspect,{minTarget:MIN_TARGET,minText:MIN_TEXT});
    result.focus=await focusAudit(page);
    for(const [key,list] of Object.entries(result)){for(const item of list){(report[key]=report[key]||new Map()).set(item,(report[key].get(item)||new Set()).add(width+' '+target.name));}}
    pages++;
    if(!target.url&&target.name.startsWith('#'))await page.goto(base+'index.html');
   }
   if(errors.length)(report.runtime=report.runtime||new Map()).set(errors.join(' | '),new Set([String(width)]));
   await page.close();
  }
 }finally{await browser.close();}
 const failing=['contrast','unparsed','targets','focus','icons','statuses','small','runtime'];
 let failed=0;
 for(const key of [...failing,'unchecked']){
  const map=report[key];const count=map?map.size:0;if(failing.includes(key))failed+=count;
  console.log(`${key}${key==='unchecked'?' (report only)':''}: ${count}`);
  if(map)for(const [item,where] of [...map].slice(0,60))console.log('  - '+item+'  ['+[...where].slice(0,3).join(', ')+(where.size>3?', …':'')+']');
 }
 console.log(`Audited ${pages} page states at 390 and 1440 px.`);
 if(failed){console.error('A11Y AUDIT FAILED: '+failed+' distinct findings.');process.exit(1);}
 console.log('PASS: accessibility and brand audit with zero findings.');
})().catch(error=>{console.error(error);process.exit(1);});

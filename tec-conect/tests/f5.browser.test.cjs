const assert=require('node:assert/strict');
const{chromium}=require('playwright');
const AI=require('../demo-ai.js');
const D=require('../data.js');
const professorCount=D.mentors.filter(person=>person.supportRole==='professor').length;
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const goal=AI.careerScenarios[0].prompt;
const errors=[];let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
const active=page=>page.evaluate(()=>document.activeElement&&(document.activeElement.id||document.activeElement.tagName));
const hash=page=>page.evaluate(()=>location.hash);
const text=page=>page.locator('main').innerText();
const pinnedCards=page=>page.locator('.network-pinned .support-card');
async function belowHeader(page,selector,message){
 const box=await page.locator(selector).boundingBox();const bar=await page.locator('.topbar').boundingBox();
 check(box.y>=bar.y+bar.height-1&&box.y<bar.y+bar.height+60,message);
}

async function structure(page){
 await nav(page,'#/mentor');
 const order=await page.evaluate(()=>{const a=document.querySelector('.mentor-assistant'),n=document.querySelector('.support-network'),x=document.querySelector('.support-explorer');return !!(a.compareDocumentPosition(n)&Node.DOCUMENT_POSITION_FOLLOWING)&&!!(n.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING);});
 check(order,'Assistant, then support network, then professor explorer');
 const assistant=await page.locator('.mentor-assistant').innerText();
 check(assistant.includes('Finanzas')&&assistant.includes('1.º semestre'),'The assistant should show career and semester from the profile');
 equal(await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).count(),1,'One Explorar mi ruta button');
 const network=await page.locator('.support-network').innerText();
 for(const value of ['Mi mentor institucional','Elena Cruz','Mi director de carrera','Rodrigo Navarro','Director de Finanzas','Profesores fijados','Aún no fijas profesores'])check(network.includes(value),'Network should show '+value);
 equal(await page.locator('.support-network [data-action="toggle-pin"]').count(),0,'Mentor and director cannot be unpinned');
 check(!network.includes('Pendiente de aceptación'),'Orientation never confirms human contact');
 equal(await page.locator('.support-explorer .person-card').count(),professorCount,'The explorer lists every professor');
}

async function emptyAndChip(page){
 await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).click();await settle(page);
 equal(await page.locator('#career-goal').getAttribute('aria-invalid'),'true','An empty goal should be invalid');
 equal(await active(page),'career-goal','Focus should return to the goal field');
 check((await page.locator('#live').innerText()).includes('Revisa el campo obligatorio'),'The error should be announced');
 equal(await hash(page),'#/mentor','An invalid goal must not open the plan');
 await page.locator('#career-chip-stock-market').click();await settle(page);
 equal(await page.locator('#career-goal').inputValue(),goal,'The chip should fill the goal');
 equal(await page.locator('#career-goal').getAttribute('aria-invalid'),null,'The chip clears the stale error');
 equal(await active(page),'career-goal','Focus should move to the filled goal');
 await belowHeader(page,'#career-goal','The filled goal should be scrolled below the sticky header');
}

async function planFlow(page){
 await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).click();await settle(page);await settle(page);
 equal(await hash(page),'#/mentor/plan','A recognized goal should open the plan route');
 equal(await page.locator('main h1').innerText(),'Tu ruta de ejemplo','The plan should have its heading');
 equal(await active(page),'H1','Focus should move to the plan heading');
 equal(await page.evaluate(()=>scrollY),0,'The plan should open from the top');
 equal(await page.locator('.career-plan h2').allInnerTexts(),['Tu meta y punto de partida','Ruta sugerida','Materias para explorar','Profesores para conversar','Intercambio o concentración','Siguiente conversación'],'The plan should show the six sections in order');
 const body=await text(page);
 for(const value of ['Ejemplo de orientación','Fundamentos','Preparación profesional','Estadística aplicada','Análisis de mercados','Instrumentos financieros','Paula Ortiz','Gabriel Soto','Elena Cruz','Rodrigo Navarro','no inscribe'])check(body.includes(value),'Plan should show '+value);

 await page.locator('#alt-button-exchange').click();await settle(page);
 equal(await page.locator('#alt-button-exchange').getAttribute('aria-pressed'),'true','Selecting an option marks it');
 equal(await page.locator('#alt-button-concentration').getAttribute('aria-pressed'),'false','The other option stays available');
 check((await text(page)).includes('Opción que estás explorando'),'The selected option is labelled with text');
 check((await text(page)).includes('Qué revisar con tu director'),'The selected option shows what to review');
 equal(await active(page),'alt-button-exchange','Focus stays on the chosen option');
 await page.locator('#alt-button-concentration').click();await settle(page);
 equal(await page.locator('#alt-button-exchange').getAttribute('aria-pressed'),'false','Switching options keeps both accessible');
 equal(await page.locator('#alt-button-concentration').getAttribute('aria-pressed'),'true','The new option is selected');

 await page.locator('#pin-plan-paula-ortiz').click();await settle(page);
 equal(await page.locator('#pin-plan-paula-ortiz').getAttribute('data-pinned'),'true','A professor can be pinned from the plan');
 check((await page.locator('#pin-plan-paula-ortiz').innerText()).includes('Quitar de mi red'),'The pin control now states the next action');
 const smallest=await page.evaluate(()=>Math.min(...[...document.querySelectorAll('.career-plan .text-link, .career-plan .person-career, main .back-link, .career-plan .status')].map(el=>parseFloat(getComputedStyle(el).fontSize))));
 check(smallest>=12,'Plan text should be at least 12px (was '+smallest+')');
 equal(await active(page),'pin-plan-paula-ortiz','Focus stays on the pin control');
 check((await page.locator('#toast').innerText()).includes('Fijaste a Paula Ortiz'),'Pinning is confirmed');
}

async function networkFlow(page,width){
 await page.locator('main .back-link').first().click();await settle(page);
 equal(await hash(page),'#/mentor','The back link returns to Mentor Match');
 equal(await page.locator('#career-goal').inputValue(),goal,'The goal is kept when returning');
 equal(await page.locator('.career-summary a[href="#/mentor/plan"]').count(),1,'The assistant links back to the plan');
 equal(await pinnedCards(page).count(),1,'The pinned professor appears once in the network');
 equal(await page.locator('.network-pinned [data-person="paula-ortiz"].support-card').count(),1,'Paula is the pinned professor');
 equal(await page.locator('#pin-explorer-paula-ortiz').getAttribute('data-pinned'),'true','The explorer reflects the pin');
 const smallestExplorer=await page.evaluate(()=>Math.min(...[...document.querySelectorAll('.support-explorer-card .tag, .support-explorer-card .availability, .support-explorer-card .person-career, .support-card .text-link')].map(el=>parseFloat(getComputedStyle(el).fontSize))));
 check(smallestExplorer>=12,'Explorer and network text should be at least 12px (was '+smallestExplorer+')');

 await page.setViewportSize({width:width===390?1440:390,height:900});await settle(page);
 equal(await page.locator('#career-goal').inputValue(),goal,'The goal survives resize');
 equal(await pinnedCards(page).count(),1,'The network survives resize');
 await page.setViewportSize({width,height:900});await settle(page);

 await page.locator('#pin-explorer-gabriel-soto').click();await settle(page);
 equal(await pinnedCards(page).count(),2,'Pinning from the explorer adds a second professor');
 await page.locator('#pin-explorer-paula-ortiz').click();await settle(page);
 equal(await pinnedCards(page).count(),1,'Unpinning from the explorer removes that professor only');
 await page.locator('#pin-network-gabriel-soto').click();await settle(page);
 equal(await pinnedCards(page).count(),0,'Unpinning from the network removes the card');
 equal(await active(page),'pinned-heading','Focus moves to the pinned heading when the card disappears');
 check((await page.locator('.support-network').innerText()).includes('Aún no fijas profesores'),'The empty pinned state returns');
 check((await page.locator('.support-network').innerText()).includes('Elena Cruz'),'The assigned mentor stays visible');

 await page.locator('.support-network').getByRole('link',{name:'Rodrigo Navarro',exact:true}).click();await settle(page);
 equal(await hash(page),'#/mentor/rodrigo-navarro','The director profile opens');
 check((await page.locator('.selected-content').innerText()).includes('Director de Finanzas'),'The director keeps the role');
 await page.locator('.selected-content').getByRole('link',{name:'Solicitar orientación',exact:true}).click();await settle(page);
 equal(await hash(page),'#/mentor/rodrigo-navarro/request','The request form opens');
 await page.locator('#goal').fill('Quiero revisar cuándo conviene un intercambio.');
 await page.getByRole('radio',{name:'En línea',exact:true}).check();
 await page.getByRole('button',{name:/Enviar solicitud/}).click();await settle(page);
 check((await page.locator('.selected-content').innerText()).includes('Pendiente de aceptación'),'The orientation request stays pending');
 await nav(page,'#/mentor');
 check((await page.locator('.support-network [data-person="rodrigo-navarro"]').innerText()).includes('Pendiente de aceptación'),'The network shows the pending request');
}

async function unrecognized(page){
 await page.locator('#career-goal').fill('quiero ser diseñadora');
 await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).click();await settle(page);
 equal(await hash(page),'#/mentor','An unrecognized goal stays on Mentor Match');
 equal(await page.locator('.career-summary').getAttribute('data-status'),'unrecognized','The assistant explains it has no example');
 equal(await active(page),'career-result-heading','Focus moves to the explanation');
 equal(await page.locator('.career-summary a[href="#/mentor/plan"]').count(),0,'No plan link for an unrecognized goal');
 await page.locator('#career-suggestion-stock-market').click();await settle(page);
 equal(await page.locator('#career-goal').inputValue(),goal,'The suggestion fills the goal');
}

async function resetFlow(page){
 await page.locator('[data-action="reset"]:visible').first().click();await settle(page);
 await nav(page,'#/mentor');
 equal(await page.locator('#career-goal').inputValue(),'','Reset clears the goal');
 equal(await pinnedCards(page).count(),0,'Reset clears pinned professors');
 check((await page.locator('.support-network').innerText()).includes('Rodrigo Navarro'),'Reset keeps the director');
 check(!(await page.locator('.support-network').innerText()).includes('Pendiente de aceptación'),'Reset clears orientation requests');
 await nav(page,'#/mentor/plan');
 equal(await page.locator('main h1').innerText(),'Aún no hay una ruta','Reset clears the plan');
}

async function run(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/mentor');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await settle(page);
  await structure(page);
  await emptyAndChip(page);
  await planFlow(page);
  const planOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  check(!planOverflow,'No horizontal overflow on the plan at '+width);
  await networkFlow(page,width);
  await unrecognized(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  check(!overflow,'No horizontal overflow on Mentor Match at '+width);
  await resetFlow(page);
 }finally{await page.close();}
}

(async()=>{
 const browser=await chromium.launch(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{});
 try{for(const width of [390,1440])await run(browser,width);}finally{await browser.close();}
 equal(errors,[],'No runtime errors');
 console.log('F5 browser checks passed: '+checks);
})().catch(error=>{console.error(error);process.exit(1);});

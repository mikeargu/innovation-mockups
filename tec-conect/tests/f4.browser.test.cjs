const assert=require('node:assert/strict');
const{chromium}=require('playwright');
const AI=require('../demo-ai.js');
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const gels=AI.talentScenarios.find(item=>item.id==='running-gels').prompt;
const hackathon=AI.talentScenarios.find(item=>item.id==='hackathon').prompt;
const errors=[];let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
const result=page=>page.locator('#assistant-result');
const roles=page=>page.locator('#assistant-result .assistant-role h4').allInnerTexts();
const active=page=>page.evaluate(()=>document.activeElement&&document.activeElement.id);
const submit=async page=>{await page.getByRole('button',{name:'Encontrar mi equipo',exact:true}).click();await settle(page);};

async function structure(page){
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-form').count(),1,'Talent should show the assistant');
 equal(await page.getByRole('button',{name:'Encontrar mi equipo',exact:true}).count(),1,'Assistant should have one submit control');
 equal(await page.locator('[data-action="assistant-chip"]').count(),3,'Assistant should offer three example chips');
 equal(await page.locator('#assistant-query').getAttribute('maxlength'),'600','The textarea should cap the query length');
 const order=await page.evaluate(()=>{const a=document.querySelector('.talent-assistant'),d=document.querySelector('#directory-heading');return !!(a.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING);});
 check(order,'The assistant should come before the directory');
 equal(await page.locator('#directory-heading').innerText(),'Personas para descubrir','The directory heading should be preserved');
 equal(await page.locator('#people-search').count(),1,'The directory search should remain visible');
 equal(await page.locator('#skill-filter').count(),1,'The skill filter should remain visible');
 equal(await result(page).count(),0,'No result before the first query');
}

async function emptyAndChips(page){
 await submit(page);
 equal(await page.locator('#assistant-query').getAttribute('aria-invalid'),'true','An empty query should be marked invalid');
 equal(await active(page),'assistant-query','Focus should return to the textarea');
 check((await page.locator('.talent-assistant').innerText()).includes('Escribe qué equipo necesitas.'),'The error should be visible');
 check((await page.locator('#live').innerText()).includes('Revisa el campo obligatorio'),'The error should be announced');
 equal(await result(page).count(),0,'An empty query must not produce a result');
 await page.locator('#assistant-chip-running-gels').click();await settle(page);
 equal(await page.locator('#assistant-query').inputValue(),gels,'The chip should fill the field');
 equal(await result(page).count(),0,'A chip fills the field without answering');
 equal(await active(page),'assistant-query','Focus should move to the filled field');
 const fieldBox=await page.locator('#assistant-query').boundingBox();
 const bar=await page.locator('.topbar').boundingBox();
 check(fieldBox.y>=bar.y+bar.height-1&&fieldBox.y<bar.y+bar.height+60,'The filled field should be scrolled just below the sticky header');
 equal(await page.locator('#assistant-query').getAttribute('aria-invalid'),null,'Choosing a chip clears the stale error');
}

async function matched(page){
 await submit(page);
 await result(page).waitFor();
 equal(await active(page),'assistant-result-heading','Focus should move to the result heading');
 check((await page.locator('#assistant-result-heading').innerText()).includes('Startup de geles para correr'),'The result should name the scenario');
 check((await result(page).innerText()).includes('Respuesta de ejemplo'),'The result should be labelled as an example');
 equal(await roles(page),['Marketing','Finanzas','Diseño / desarrollo web'],'The result should be organized by role');
 const text=await result(page).innerText();
 for(const value of ['Sofía Mendoza','Camila León','Lucía Torres','Por qué coincide','Evidencia del perfil','Disponibilidad declarada','3 h por semana'])check(text.includes(value),'Result should show '+value);
 check(!/%|compatib|ranking|puntaje/i.test(text),'The result should carry no scores or percentages');
 const box=await page.locator('#assistant-result-heading').boundingBox();
 const header=await page.locator('.topbar').boundingBox();
 check(box.y>=header.y+header.height-1,'The result heading should be visible below the sticky header');
 check(box.y<header.y+header.height+60,'The result heading should be scrolled just below the sticky header, not left down the page');
}

async function profileAndExplore(page,width){
 await page.locator('[data-person="sofia-mendoza"]').getByRole('link',{name:'Ver perfil'}).click();await settle(page);
 equal(await page.evaluate(()=>location.hash),'#/talent/sofia-mendoza','Ver perfil should open the existing profile');
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-query').inputValue(),gels,'The query should survive navigation');
 equal(await roles(page),['Marketing','Finanzas','Diseño / desarrollo web'],'The result should survive navigation');

 await page.setViewportSize({width:width===390?1440:390,height:900});await settle(page);
 equal(await page.locator('#assistant-query').inputValue(),gels,'The query should survive resize');
 equal(await roles(page),['Marketing','Finanzas','Diseño / desarrollo web'],'The result should survive resize');
 await page.setViewportSize({width,height:900});await settle(page);

 await page.getByRole('button',{name:'Explorar personas con Marketing',exact:true}).click();await settle(page);
 equal(await page.locator('#skill-filter').inputValue(),'Marketing','Exploring should set the skill filter');
 equal(await page.locator('#results .person-card').count(),1,'The directory should show only people with the skill');
 check((await page.locator('#results .person-card').innerText()).includes('Sofía Mendoza'),'The filtered directory should show Sofía');
 equal(await active(page),'directory-heading','Focus should move to the directory heading');
 const directoryBox=await page.locator('#directory-heading').boundingBox();
 const topbar=await page.locator('.topbar').boundingBox();
 const atPageEnd=await page.evaluate(()=>Math.abs(window.scrollY+window.innerHeight-document.documentElement.scrollHeight)<2);
 check(directoryBox.y>=topbar.y+topbar.height-1,'The directory heading should not hide under the sticky header');
 check(directoryBox.y<topbar.y+topbar.height+60||atPageEnd,'The directory heading should be scrolled just below the sticky header unless the page ends first');
 equal(await roles(page),['Marketing','Finanzas','Diseño / desarrollo web'],'The assistant result should remain after exploring');

 // Clearing a directory search must not clear the assistant or other areas.
 await page.locator('#people-search').fill('zzzz');await settle(page);
 equal(await page.locator('#results .person-card').count(),0,'A search without matches should empty the directory');
 await page.locator('[data-action="clear-search"]').click();await settle(page);
 equal(await page.locator('#assistant-query').inputValue(),gels,'Clearing the search should keep the query');
 equal(await result(page).count(),1,'Clearing the search should keep the result');
 equal(await page.locator('#skill-filter').inputValue(),'Marketing','Clearing the search keeps the skill filter');
 await page.locator('#skill-filter').selectOption('all');await settle(page);
}

async function contactUnchanged(page){
 await nav(page,'#/talent/sofia-mendoza/contact');
 await page.locator('#message').fill('Hola, me gustaría sumarte a mi equipo.');
 await page.getByRole('button',{name:/Enviar solicitud/}).click();await settle(page);
 check((await page.locator('main').innerText()).includes('Pendiente de aceptación'),'The existing contact flow should still register a request');
 await nav(page,'#/talent');
 check((await page.locator('[data-person="sofia-mendoza"]').innerText()).includes('Pendiente de aceptación'),'The assistant card should reflect the pending request');
}

async function unrecognizedAndScenarios(page){
 await page.locator('#assistant-query').fill('quiero cocinar pasta');
 await submit(page);
 equal(await result(page).getAttribute('data-status'),'unrecognized','An unknown query should be unrecognized');
 equal(await page.locator('#assistant-result .assistant-person').count(),0,'No people for an unrecognized query');
 equal(await page.locator('#assistant-result [data-action="assistant-chip"]').count(),3,'Unrecognized queries should offer the three scenarios');
 await page.locator('#assistant-suggestion-hackathon').click();await settle(page);
 equal(await page.locator('#assistant-query').inputValue(),hackathon,'A suggestion should fill the field');
 await submit(page);
 await result(page).waitFor();
 equal(await result(page).getAttribute('data-scenario'),'hackathon','The hackathon scenario should be answered');
 equal((await roles(page)).length,4,'The hackathon scenario should list four roles');
 await page.locator('#assistant-chip-campus-app').click();await settle(page);await submit(page);
 equal(await result(page).getAttribute('data-scenario'),'campus-app','The campus app scenario should be answered');
 equal(await roles(page),['Desarrollo de la app','Seguridad y privacidad','Investigación con estudiantes'],'The campus app scenario should list its three roles');
 check((await result(page).innerText()).includes('Mateo Salas'),'The campus app scenario should recommend a security profile');
 equal(await page.locator('#assistant-chip-water-project').count(),0,'The water example chip should be gone');
}

async function resetFlow(page){
 await page.locator('[data-action="reset"]:visible').first().click();await settle(page);
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-query').inputValue(),'','Reset should clear the query');
 equal(await result(page).count(),0,'Reset should clear the result');
 equal(await page.locator('#skill-filter').inputValue(),'all','Reset should clear the skill filter');
}

async function run(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/talent');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await settle(page);
  await structure(page);
  await emptyAndChips(page);
  await matched(page);
  await profileAndExplore(page,width);
  await contactUnchanged(page);
  await unrecognizedAndScenarios(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  check(!overflow,'No horizontal overflow at '+width);
  await resetFlow(page);
 }finally{await page.close();}
}

(async()=>{
 const browser=await chromium.launch(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{});
 try{for(const width of [390,1440])await run(browser,width);}finally{await browser.close();}
 equal(errors,[],'No runtime errors');
 console.log('F4 browser checks passed: '+checks);
})().catch(error=>{console.error(error);process.exit(1);});

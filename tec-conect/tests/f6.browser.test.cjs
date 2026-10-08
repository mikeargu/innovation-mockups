// F6 integrated journey: one session across Profile, Campus Pulse, Talent Network and Mentor Match,
// then a browser refresh that must restore the clean demo. Runs at 390 and 1440 px.
const assert=require('node:assert/strict');
const{chromium}=require('playwright');
const D=require('../data.js');
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const waterEvent=D.pulse.find(item=>item.id==='tratamiento-agua');
const psychologyArticle=D.pulse.find(item=>item.kind==='article'&&item.topics.includes('psychology'));
const errors=[];let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
const hash=page=>page.evaluate(()=>location.hash);
const active=page=>page.evaluate(()=>document.activeElement&&(document.activeElement.id||document.activeElement.className||document.activeElement.tagName));
const text=(page,selector='main')=>page.locator(selector).innerText();

async function skipLink(page){
 // Fresh page load: the first Tab must reach the skip link (a prior click would move the starting point).
 await page.keyboard.press('Tab');
 equal((await page.evaluate(()=>document.activeElement.textContent.trim())),'Saltar al contenido','The skip link is the first keyboard stop');
 await page.keyboard.press('Enter');await settle(page);
 equal(await active(page),'main','The skip link moves focus to the main content');
 equal(await hash(page),'#/pulse','The skip link keeps the current route');
}

async function profileToPulse(page){
 await nav(page,'#/profile/edit');
 await page.locator('[data-profile-field="semester"]').fill('2');
 await page.getByRole('button',{name:/Guardar perfil/}).click();await settle(page);
 equal(await hash(page),'#/profile','Saving the profile returns to the profile');
 check((await text(page)).includes('2.º semestre'),'The saved semester is shown on the profile');
 await nav(page,'#/profile/preferences');
 // F5A case: events, reading and job areas are chosen independently.
 for(const box of await page.locator('input[name^="topics-"]').all())await box.uncheck();
 await page.locator('input[name="topics-events"][value="water-sustainability"]').check();
 await page.locator('input[name="topics-articles"][value="psychology"]').check();
 await page.locator('input[name="topics-opportunities"][value="finance"]').check();
 await page.locator('#preferences-enabled').check();
 await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
 await nav(page,'#/pulse');
 check((await page.locator('[data-section="events"] .pulse-card').first().innerText()).includes(waterEvent.title),'Pulse puts the event matching the new topic first');
 check((await text(page)).includes('Por tu interés en Agua / Sostenibilidad · Eventos'),'Pulse explains the match and its group');
 check((await page.locator('[data-section="articles"] .pulse-card').first().innerText()).includes(psychologyArticle.title),'Articles put the Psicología reading first');
 const offers=await page.locator('[data-section="opportunities"] .pulse-card').allInnerTexts();
 check(offers.length>=2&&offers.every(card=>card.includes('Por tu área de búsqueda: Finanzas')),'Opportunities recommend only Finanzas roles');
 check(offers.some(card=>card.includes('Mente Clara')),'A finance role at a wellness company is recommended by its area, not its sector');
 await nav(page,'#/profile/preferences');
 for(const [group,expected] of [['events',['water-sustainability']],['articles',['psychology']],['opportunities',['finance']]])
  equal(await page.locator(`input[name="topics-${group}"]:checked`).evaluateAll(nodes=>nodes.map(node=>node.value)),expected,'The '+group+' group keeps its own selection after navigating');
 await nav(page,'#/pulse');
 await nav(page,'#/pulse/'+waterEvent.id+'/register');
 check((await text(page)).includes('2.º semestre'),'Registration reviews the updated profile');
 await page.getByRole('button',{name:'Confirmar registro'}).click();await settle(page);
 equal(await page.locator('.selected-content h1').innerText(),'Registro simulado','The event registration is simulated');
}

async function talentByKeyboard(page){
 await nav(page,'#/talent');
 await page.locator('#assistant-chip-campus-app').focus();await page.keyboard.press('Enter');await settle(page);
 equal(await active(page),'assistant-query','Activating a chip with Enter fills and focuses the query');
 await page.getByRole('button',{name:'Encontrar mi equipo',exact:true}).focus();await page.keyboard.press('Enter');await settle(page);
 equal(await page.locator('#assistant-result').getAttribute('data-scenario'),'campus-app','The assistant answers when submitted from the keyboard');
 equal(await active(page),'assistant-result-heading','Focus moves to the answer');
 await page.locator('[data-person="mateo-salas"]').first().getByRole('link',{name:'Ver perfil'}).click();await settle(page);
 equal(await hash(page),'#/talent/mateo-salas','Ver perfil opens the recommended person');
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-result').getAttribute('data-scenario'),'campus-app','The answer is still there after visiting a profile');
}

async function mentorPlan(page){
 await nav(page,'#/mentor');
 check((await text(page,'.mentor-assistant')).includes('2.º semestre'),'Mentor Match uses the updated semester');
 await page.locator('#career-chip-stock-market').click();await settle(page);
 await page.getByRole('button',{name:'Explorar mi ruta',exact:true}).click();await settle(page);await settle(page);
 equal(await hash(page),'#/mentor/plan','The goal opens the plan');
 check((await text(page,'.career-plan')).includes('2.º semestre'),'The plan reflects the updated semester');
 await page.locator('#pin-plan-gabriel-soto').click();await settle(page);
 await page.locator('main .back-link').first().click();await settle(page);
 equal(await page.locator('.network-pinned .support-card').count(),1,'The pinned professor joins the network');
 check((await text(page,'.network-pinned')).includes('Gabriel Soto'),'Gabriel Soto is pinned');
}

async function persistence(page){
 await nav(page,'#/pulse');
 check((await page.locator('.pulse-card[data-item="'+waterEvent.id+'"]').first().innerText()).includes('Registro simulado'),'The registration persists across areas');
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-result').count(),1,'The Talent answer persists across areas');
 await nav(page,'#/mentor/plan');
 equal(await page.locator('main h1').innerText(),'Tu ruta de ejemplo','The plan persists across areas');
}

async function refresh(page){
 await page.reload();await page.locator('main h1').waitFor();await settle(page);
 await nav(page,'#/profile');
 check((await text(page)).includes('1.º semestre'),'Refresh restores the example profile');
 await nav(page,'#/pulse');
 check(!(await text(page)).includes('Por tu interés en Agua / Sostenibilidad'),'Refresh restores the default topics');
 check(!(await text(page)).includes('Registro simulado'),'Refresh clears registrations');
 await nav(page,'#/talent');
 equal(await page.locator('#assistant-result').count(),0,'Refresh clears the Talent answer');
 await nav(page,'#/mentor');
 equal(await page.locator('#career-goal').inputValue(),'','Refresh clears the goal');
 equal(await page.locator('.network-pinned .support-card').count(),0,'Refresh clears pinned professors');
 check((await text(page,'.support-network')).includes('Elena Cruz'),'The assigned mentor is back');
}

async function run(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/pulse');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await settle(page);
  await skipLink(page);
  await profileToPulse(page);
  await talentByKeyboard(page);
  await mentorPlan(page);
  await persistence(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  check(!overflow,'No horizontal overflow at '+width);
  await refresh(page);
 }finally{await page.close();}
}

(async()=>{
 const browser=await chromium.launch(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{});
 try{for(const width of [390,1440])await run(browser,width);}finally{await browser.close();}
 equal(errors,[],'No runtime errors');
 console.log('F6 integrated journey checks passed: '+checks);
})().catch(error=>{console.error(error);process.exit(1);});

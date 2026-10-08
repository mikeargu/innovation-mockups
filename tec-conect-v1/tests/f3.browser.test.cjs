const assert=require('node:assert/strict');
const{chromium}=require('playwright');
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const errors=[];let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
const text=page=>page.locator('main').innerText();
const heading=page=>page.locator('.selected-content h1').innerText();
async function resetDemo(page){await page.locator('[data-action="reset"]:visible').first().click();await settle(page);}

async function eventFlow(page){
 await nav(page,'#/pulse/laboratorio-ideas');
 equal(await page.getByRole('link',{name:'Registrarme',exact:false}).count(),1,'Event detail should offer one registration link');
 equal(await page.locator('[data-action="add-calendar"]').count(),1,'Event detail should offer the calendar action');
 equal(await page.getByText('Postúlate').count(),0,'Events must not offer applications');

 // Calendar export is independent of registration.
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Agregar a mi calendario'}).click()]);
 equal(download.suggestedFilename(),'laboratorio-ideas.ics','The download should use the publication id');
 const chunks=[];for await(const chunk of await download.createReadStream())chunks.push(chunk);
 const ics=Buffer.concat(chunks).toString('utf8');
 check(ics.includes('DTSTART:20261009T220000Z')&&ics.includes('DTEND:20261010T000000Z'),'The calendar file should contain start and end');
 check(ics.includes('SUMMARY:[EJEMPLO] '),'The calendar file should mark the event as an example');
 check(ics.includes('UID:laboratorio-ideas@tec-conect.example'),'The calendar file should carry a stable UID');
 check(!/[^\r]\n/.test(ics),'The calendar file should use CRLF line endings');
 check(!(await text(page)).includes('Registro simulado'),'Exporting the calendar must not register the student');
 equal(await page.getByRole('link',{name:'Registrarme'}).count(),1,'Registration should still be available after the export');

 // Review -> confirm.
 await page.getByRole('link',{name:'Registrarme'}).click();await settle(page);
 equal(await page.evaluate(()=>location.hash),'#/pulse/laboratorio-ideas/register','Registrarme should open the review route');
 equal(await heading(page),'Revisa tu registro','The review screen should have its heading');
 const review=await text(page);
 for(const value of ['Valeria Álvarez','Finanzas','valeria.alvarez@example.com','Laboratorio de ideas'])check(review.includes(value),'Review should show '+value);
 check(review.includes('simulación'),'Review should state that the action is simulated');
 equal(await page.getByRole('button',{name:'Confirmar registro'}).count(),1,'Review should have one confirm control');
 await page.getByRole('button',{name:'Confirmar registro'}).click();await settle(page);
 equal(await heading(page),'Registro simulado','Confirmation should be visible from the top');
 equal(await page.evaluate(()=>window.scrollY),0,'Confirmation should restore scroll to the top');
 equal(await page.evaluate(()=>document.activeElement.tagName),'H1','Focus should move to the confirmation heading');
 check(await page.locator('#toast').isVisible(),'A toast should confirm the simulated registration');
 check((await text(page)).includes('No se envió información fuera del prototipo'),'Confirmation should explain what was simulated');

 // Existing registration is shown instead of a second form.
 await nav(page,'#/pulse/laboratorio-ideas/register');
 equal(await heading(page),'Registro simulado','Repeating the route should show the existing registration');
 equal(await page.locator('#register-form').count(),0,'No second registration form should be offered');
 await nav(page,'#/pulse/laboratorio-ideas');
 check((await text(page)).includes('Registro simulado'),'Detail should show the registration status');
 equal(await page.getByRole('link',{name:'Registrarme'}).count(),0,'Detail should not offer Registrarme twice');
 equal(await page.locator('[data-action="add-calendar"]').count(),1,'The calendar action should remain available');

 // Saving stays independent.
 await page.locator('#save-detail-laboratorio-ideas').click();await settle(page);
 check((await text(page)).includes('Guardado'),'Saving should still work');
 check((await text(page)).includes('Registro simulado'),'Saving must not alter the registration');
 await nav(page,'#/pulse');
 check((await page.locator('.pulse-card[data-item="laboratorio-ideas"]').first().innerText()).includes('Registro simulado'),'Cards should show the registration status with text');

 // Workshops follow the same path; articles and internships do not.
 await nav(page,'#/pulse/taller-cv');
 equal(await page.getByRole('link',{name:'Registrarme'}).count(),1,'Workshops should be registrable');
 for(const id of ['huerto','practica-marketing']){
  await nav(page,'#/pulse/'+id);
  const body=await text(page);
  for(const word of ['Registrarme','Agregar a mi calendario','Postúlate'])check(!body.includes(word),id+' must not show '+word);
 }
 for(const hash of ['#/pulse/huerto/register','#/pulse/practica-finanzas/register','#/pulse/laboratorio-ideas/apply','#/pulse/practica-marketing/apply']){
  await nav(page,hash);
  equal(await page.evaluate(()=>location.hash),'#/pulse','Invalid action route '+hash+' should recover to Pulse');
 }
}

async function applicationFlow(page,width){
 // External source never counts as an application.
 await nav(page,'#/pulse/practica-marketing');
 const more=page.locator('.selected-content').getByRole('link',{name:'Saber más',exact:true});
 equal(await more.count(),1,'External internship should keep Saber más');
 const [popup]=await Promise.all([page.waitForEvent('popup'),more.click()]);
 await popup.waitForLoadState();await popup.close();
 check(!(await text(page)).includes('Postulación simulada'),'Opening the source must not record an application');

 await nav(page,'#/pulse/practica-finanzas');
 equal(await page.getByRole('link',{name:'Postúlate'}).count(),1,'Local internship should offer Postúlate');
 equal(await page.locator('.selected-content').getByRole('link',{name:'Saber más',exact:true}).count(),1,'Local internship should keep Saber más');
 await page.getByRole('link',{name:'Postúlate'}).click();await settle(page);
 equal(await page.evaluate(()=>location.hash),'#/pulse/practica-finanzas/apply','Postúlate should open the application route');
 const review=await text(page);
 for(const value of ['Nexo Capital','Valeria Álvarez','valeria.alvarez@example.com'])check(review.includes(value),'Application should show '+value);

 // Empty interest is rejected accessibly.
 await page.getByRole('button',{name:'Confirmar postulación'}).click();await settle(page);
 equal(await page.locator('#interest').getAttribute('aria-invalid'),'true','Empty interest should be marked invalid');
 equal(await page.evaluate(()=>document.activeElement.id),'interest','Focus should move to the invalid field');
 check((await text(page)).includes('Cuéntanos qué te interesa'),'The error should be visible');
 check(!(await page.locator('#toast').innerText()).includes('Postulación simulada'),'No success toast on a rejected submission');
 equal(await page.locator('#live').innerText(),'Revisa el campo obligatorio: Cuéntanos qué te interesa de esta práctica.','The rejection should be announced to assistive technology');

 // Draft survives navigation and resize.
 await page.locator('#interest').fill('Me interesa comparar escenarios de presupuesto.');
 await nav(page,'#/pulse/practica-finanzas');
 await nav(page,'#/pulse/practica-finanzas/apply');
 equal(await page.locator('#interest').inputValue(),'Me interesa comparar escenarios de presupuesto.','Draft should survive navigation');
 await page.setViewportSize({width:width===390?1440:390,height:900});await settle(page);
 equal(await page.locator('#interest').inputValue(),'Me interesa comparar escenarios de presupuesto.','Draft should survive resize');
 await page.setViewportSize({width,height:900});await settle(page);

 await page.getByRole('button',{name:'Confirmar postulación'}).click();await settle(page);
 equal(await heading(page),'Postulación simulada enviada','Confirmation should be visible');
 equal(await page.evaluate(()=>window.scrollY),0,'Confirmation should restore scroll to the top');
 equal(await page.evaluate(()=>document.activeElement.tagName),'H1','Focus should move to the confirmation heading');
 check((await text(page)).includes('No se envió nada a una empresa real'),'Confirmation should explain what was simulated');
 check((await text(page)).includes('6 de octubre de 2026'),'Confirmation should show the simulated date');

 await nav(page,'#/pulse/practica-finanzas/apply');
 equal(await heading(page),'Postulación simulada enviada','Repeating should show the existing application');
 equal(await page.locator('#apply-form').count(),0,'No second application form');
 await nav(page,'#/pulse/practica-finanzas');
 check((await text(page)).includes('Postulación simulada enviada'),'Detail should show the application status');
 equal(await page.getByRole('link',{name:'Postúlate'}).count(),0,'Detail should not offer Postúlate twice');
 equal(await page.locator('.selected-content').getByRole('link',{name:'Saber más',exact:true}).count(),1,'Detail should keep Saber más');
 await nav(page,'#/pulse');
 check((await page.locator('.pulse-card[data-item="practica-finanzas"]').first().innerText()).includes('Postulación simulada enviada'),'Cards should show the application status with text');
}

async function resetFlow(page){
 await resetDemo(page);
 await nav(page,'#/pulse/laboratorio-ideas');
 equal(await page.getByRole('link',{name:'Registrarme'}).count(),1,'Reset should clear the registration');
 await nav(page,'#/pulse/practica-finanzas');
 equal(await page.getByRole('link',{name:'Postúlate'}).count(),1,'Reset should clear the application');
 await nav(page,'#/pulse/practica-finanzas/apply');
 equal(await page.locator('#interest').inputValue(),'','Reset should clear application drafts');
}

async function run(browser,width){
 const page=await browser.newPage({viewport:{width,height:900},acceptDownloads:true});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/pulse');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await settle(page);
  await eventFlow(page);
  await applicationFlow(page,width);
  await resetFlow(page);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth);
  check(!overflow,'No horizontal overflow at '+width);
 }finally{await page.close();}
}

(async()=>{
 const browser=await chromium.launch(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{});
 try{for(const width of [390,1440])await run(browser,width);}finally{await browser.close();}
 equal(errors,[],'No runtime errors');
 console.log('F3 browser checks passed: '+checks);
})().catch(error=>{console.error(error);process.exit(1);});

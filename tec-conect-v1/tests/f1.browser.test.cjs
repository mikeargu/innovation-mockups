// F1 acceptance checks; Playwright is a development-only dependency.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.TEC_URL || 'http://127.0.0.1:8765/';
const data = require('../data.js');
let checks = 0;
const errors=[];
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const check=(value,message)=>{assert.ok(value,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
async function edit(page){await page.locator('main a[href="#/profile/edit"]').first().click();await settle(page);}
async function save(page){await page.getByRole('button',{name:'Guardar perfil',exact:true}).click();await settle(page);}

async function flow(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/pulse');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);
  check(await page.locator('a[href="#/profile"]:visible').count()>0,'Account should provide an accessible profile entry');
  const entry=page.locator('a[href="#/profile"]:visible').first();
  const box=await entry.boundingBox();check(box.height>=44 && box.width>=44,'Profile entry should have a44px touch target');
  await entry.click();await settle(page);
  equal(await page.evaluate(()=>location.hash),'#/profile','Account should open own profile');
  check((await page.locator('main').innerText()).includes('Valeria Álvarez'),'Default profile name should be shown');
  check((await page.locator('main').innerText()).includes('Finanzas'),'Default career should be shown');
  equal(await page.locator('.sidebar nav:visible a, .bottomnav:visible a').count(),3,'Profile should keep exactly three main destinations');

  // Invalid profile saves remain editable, and drafts survive resize/navigation.
  await edit(page);
  await page.locator('#profile-name').fill('   ');await save(page);
  equal(await page.locator('#profile-name').getAttribute('aria-invalid'),'true','Empty display name should prevent saving');
  equal(await page.evaluate(()=>location.hash),'#/profile/edit','Invalid profile should remain in editor');
  await page.locator('#profile-name').fill('Ana López');
  const bio='Exploro finanzas y datos. <script>window.f1Injected=true</script>';
  await page.locator('#profile-bio').fill(bio);
  await page.setViewportSize({width:width<1024?1440:390,height:900});await settle(page);
  equal(await page.locator('#profile-name').inputValue(),'Ana López','Resize should preserve the name draft');
  equal(await page.locator('#profile-bio').inputValue(),bio,'Resize should preserve the bio draft');
  await page.setViewportSize({width,height:900});await settle(page);
  await nav(page,'#/pulse');await nav(page,'#/profile');
  check((await page.locator('main').innerText()).includes('Valeria Álvarez'),'Preview should use confirmed name before save');
  await edit(page);
  equal(await page.locator('#profile-name').inputValue(),'Ana López','Navigation should preserve profile draft');
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();await settle(page);
  await edit(page);
  equal(await page.locator('#profile-name').inputValue(),'Valeria Álvarez','Cancel should discard the profile draft');
  await page.locator('#profile-name').fill('Ana López');await page.locator('#profile-bio').fill(bio);
  await save(page);
  equal(await page.evaluate(()=>location.hash),'#/profile','Saving should return to own preview');
  equal(await page.evaluate(()=>scrollY),0,'Saved profile should be presented from the top');
  check((await page.locator('main').innerText()).includes('Ana López'),'Profile should reflect the saved name');
  check((await page.locator('main').innerText()).includes(bio),'Bio should be rendered as literal text');
  equal(await page.locator('main script').count(),0,'Bio should not insert executable markup');
  equal(await page.evaluate(()=>window.f1Injected),undefined,'Markup in user text must not execute');
  check((await page.locator('.sidebar-footer, .topbar').allTextContents()).join(' ').includes('Ana'),'Shell should use saved account name');

  // Editable project/skill rows validate atomically and become visible after save.
  await edit(page);
  const initialProjects=await page.locator('.project-row').count();
  const initialSkills=await page.locator('.skill-row').count();
  await page.getByRole('button',{name:'Añadir proyecto',exact:true}).click();await settle(page);
  equal(await page.locator('.project-row').count(),initialProjects+1,'Adding a project should create a draft row');
  await save(page);
  equal(await page.locator(`#profile-project-${initialProjects}-title`).getAttribute('aria-invalid'),'true','Untitled project should block saving');
  const invalidBox=await page.locator(`#profile-project-${initialProjects}-title`).boundingBox();
  const headerBottom=await page.locator('.topbar').evaluate(el=>el.getBoundingClientRect().bottom);
  check(invalidBox.y>=headerBottom-1 && invalidBox.y<900,'Invalid project field should be visible below the sticky header');
  await page.locator(`#profile-project-${initialProjects}-title`).fill('Geles para correr · demo');
  await page.locator(`#profile-project-${initialProjects}-description`).fill('Proyecto de ejemplo de una startup para corredores.');
  await page.locator(`#profile-project-${initialProjects}-role`).fill('Planeación financiera');
  await page.locator(`#profile-project-${initialProjects}-tags`).fill('Deporte, Finanzas');
  await page.locator(`#profile-project-${initialProjects}-url`).fill('javascript:alert(1)');await save(page);
  equal(await page.locator(`#profile-project-${initialProjects}-url`).getAttribute('aria-invalid'),'true','Unsafe project link should block saving');
  await page.locator(`#profile-project-${initialProjects}-url`).fill('https://example.com/geles');
  await page.getByRole('button',{name:'Añadir habilidad',exact:true}).click();await settle(page);
  await page.locator(`#profile-skill-${initialSkills}-name`).fill('Planeación deportiva');
  await page.locator(`#profile-skill-${initialSkills}-level`).selectOption('Intermedio');
  await save(page);
  check((await page.locator('main').innerText()).includes('Geles para correr · demo'),'Saved project should appear in own profile');
  check((await page.locator('main').innerText()).includes('Planeación deportiva'),'Saved skill should appear in own profile');
  await edit(page);
  await page.locator(`#profile-project-${initialProjects}-title`).fill('Geles para correr · editado');await save(page);
  check((await page.locator('main').innerText()).includes('Geles para correr · editado'),'Project edits should be saved');
  await edit(page);
  await page.getByRole('button',{name:`Eliminar proyecto ${initialProjects+1}`,exact:true}).click();await settle(page);
  await page.getByRole('button',{name:`Eliminar habilidad ${initialSkills+1}`,exact:true}).click();await settle(page);
  await save(page);
  equal((await page.locator('main').innerText()).includes('Geles para correr · editado'),false,'Removed project should disappear after save');
  equal((await page.locator('main').innerText()).includes('Planeación deportiva'),false,'Removed skill should disappear after save');

  // Discovery and contact visibility expose only chosen public fields.
  await edit(page);
  await page.locator('#profile-email').fill('privado@example.com');
  await page.locator('#profile-phone').fill('+52 55 0000 1234');
  await page.locator('#profile-linkedin').fill('https://example.com/ana');
  await page.locator('#visibility-linkedin').check();
  await page.locator('#profile-discoverable').check();
  await page.locator('#profile-collaborate').check();await save(page);
  await nav(page,'#/talent');
  equal(await page.locator('.person-card').count(),data.people.length+1,'Published collaborating profile should join the existing people');
  check((await page.locator('.person-card[data-item="self"]').innerText()).includes('Tu perfil'),'Own discoverable card should be identified');
  await page.locator('.person-card[data-item="self"] h3 a').click();await settle(page);
  const publicHTML=await page.locator('main').innerHTML();
  equal(publicHTML.includes('privado@example.com'),false,'Private email must be absent from the public DOM');
  equal(publicHTML.includes('+52 55 0000 1234'),false,'Private phone must be absent from the public DOM');
  check(publicHTML.includes('https://example.com/ana'),'Explicitly public professional link should be visible');
  equal(await page.getByRole('link',{name:'Enviar solicitud de contacto',exact:true}).count(),0,'Own profile should not offer a self-contact request');
  await nav(page,'#/profile/edit');await page.locator('#visibility-email').check();await save(page);
  await nav(page,'#/talent/self');check((await page.locator('main').innerText()).includes('privado@example.com'),'Explicitly public email should be shown');
  await nav(page,'#/profile/edit');
  await page.getByRole('button',{name:'Añadir habilidad',exact:true}).click();await settle(page);
  await page.locator(`#profile-skill-${initialSkills}-name`).fill('Escenarios bursátiles');await save(page);
  await nav(page,'#/talent');await page.locator('#skill-filter').selectOption('Escenarios bursátiles');await settle(page);
  equal(await page.locator('.person-card').count(),1,'A self-only skill should filter to the own profile');
  await nav(page,'#/profile/edit');await page.locator(`#profile-skill-${initialSkills}-name`).fill('Análisis bursátil');await save(page);
  await nav(page,'#/talent');
  equal(await page.locator('#skill-filter').inputValue(),'all','Renaming a self-only skill should normalize an unavailable filter');
  equal(await page.locator('.person-card').count(),data.people.length+1,'Renaming a selected skill should restore unfiltered discoverable people');
  await page.locator('#skill-filter').selectOption('Análisis bursátil');await settle(page);
  await nav(page,'#/profile/edit');await page.locator('#profile-collaborate').uncheck();await save(page);
  await nav(page,'#/talent');equal(await page.locator('.person-card').count(),data.people.length,'Pausing collaboration should remove own public card');
  equal(await page.locator('#skill-filter').inputValue(),'all','Hiding the sole matching profile should normalize its unavailable skill filter');
  await nav(page,'#/profile');check((await page.locator('main').innerText()).includes('Ana López'),'Own preview should remain accessible while hidden');

  // Topic settings remain separate from professional-interest editing.
  await nav(page,'#/profile/preferences');
  const finance=page.locator('input[name="topics-events"][value="finance"]');
  const water=page.locator('input[name="topics-events"][value="water-sustainability"]');
  check(await finance.isChecked(),'Finance should be an initial Pulse topic');
  await finance.uncheck();await water.check();
  await page.locator('#preferences-enabled').uncheck();
  await page.setViewportSize({width:width<1024?1440:390,height:900});await settle(page);
  check(await page.locator('input[name="topics-events"][value="water-sustainability"]').isChecked(),'Resize should preserve topic draft');
  await page.setViewportSize({width,height:900});await settle(page);
  await nav(page,'#/talent');await nav(page,'#/profile/preferences');
  check(await page.locator('input[name="topics-events"][value="water-sustainability"]').isChecked(),'Navigation should preserve topic draft');
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
  await nav(page,'#/profile/preferences');
  equal(await page.locator('input[name="topics-events"][value="finance"]').isChecked(),false,'Saved topic selection should be retained');
  check(await page.locator('input[name="topics-events"][value="water-sustainability"]').isChecked(),'Saved water topic should be retained');
  equal(await page.locator('#preferences-enabled').isChecked(),false,'Saved personalization toggle should be retained');
  await page.locator('input[name="topics-events"][value="finance"]').check();
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();await settle(page);
  await nav(page,'#/profile/preferences');
  equal(await page.locator('input[name="topics-events"][value="finance"]').isChecked(),false,'Cancel should discard preference changes');

  // Reset and reload both restore the fictional initial account and preferences.
  await page.locator('[data-action="reset"]:visible').first().click();await settle(page);
  equal(await page.evaluate(()=>location.hash),'#/pulse','Reset from settings should return to Pulse');
  await nav(page,'#/profile');check((await page.locator('main').innerText()).includes('Valeria Álvarez'),'Reset should restore initial account');
  await nav(page,'#/profile/preferences');check(await page.locator('input[name="topics-events"][value="finance"]').isChecked(),'Reset should restore initial topics');
  check(await page.locator('#preferences-enabled').isChecked(),'Reset should restore personalization setting');
  await nav(page,'#/profile/edit');await page.locator('#profile-name').fill('Otra persona');await save(page);
  await page.reload();await page.locator('main h1').waitFor();
  check((await page.locator('main').innerText()).includes('Valeria Álvarez'),'Reload should restore initial in-memory profile');
 }finally{await page.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{})});
 try{await flow(browser,390);await flow(browser,1440);equal(errors,[],'Profile flows should have no runtime errors');console.log(`PASS: ${checks} F1 profile/preference assertions on mobile and desktop.`);}
 finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

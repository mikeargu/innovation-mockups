const assert=require('node:assert/strict');
const{chromium}=require('playwright');
const D=require('../data.js');
const C=require('../state.js');
const base=process.env.TEC_URL||'http://127.0.0.1:8765/';
const errors=[];let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.deepEqual(actual,expected,message);checks++;};
const settle=page=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
async function nav(page,hash){await page.evaluate(value=>{location.hash=value;},hash);await settle(page);}
async function clickMode(page,name){await page.getByRole('button',{name,exact:true}).click();await settle(page);}

async function flow(browser,width){
 const page=await browser.newPage({viewport:{width,height:900}});
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'#/pulse');await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready);await settle(page);
  equal(await page.getByRole('button',{name:'Para ti',exact:true}).count(),1,'Pulse should expose the personalized mode');
  equal(await page.getByRole('button',{name:'Todo el campus',exact:true}).count(),1,'Pulse should expose campus-wide discovery');
  equal(await page.locator('[data-section]').evaluateAll(nodes=>nodes.map(n=>n.dataset.section)),['events','articles','opportunities','saved'],'Default dashboard should have four ordered widgets');
  check((await page.locator('[data-section="opportunities"]').innerText()).includes('CVDP'),'Career opportunities should identify the CVDP channel');

  // Pulse responds to explicit saved topics, independently of professional interests.
  await nav(page,'#/profile/preferences');
  for(const checkbox of await page.locator('input[name^="topics-"]').all()) await checkbox.uncheck();
  await page.locator('input[name="topics-events"][value="finance"]').check();
  await page.locator('#preferences-enabled').check();
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
  await nav(page,'#/pulse');
  const firstEvent=await page.locator('[data-section="events"] .pulse-card').first().innerText();
  check(firstEvent.includes('Ingresos personales'),'Finance interest should prioritize the finance conference');
  check((await page.locator('main').innerText()).includes('Por tu interés en Finanzas'),'A recommendation should explain the chosen topic');
  await clickMode(page,'Todo el campus');
  check((await page.locator('[data-section="events"] .pulse-card').first().innerText()).includes(D.pulse[0].title),'Campus-wide mode should use stable original order');
  const articleExample=D.pulse.find(item=>item.category==='news');
  const articleCard=await page.locator(`[data-section="articles"] .pulse-card[data-item="${articleExample.id}"]`).innerText();
  for(const id of articleExample.topics) check(articleCard.includes(C.topicTaxonomy.find(topic=>topic.id===id).label),'General-mode article card should expose its topic '+id);
  check(articleCard.includes(articleExample.source),'Article card should attribute its source');
  await clickMode(page,'Para ti');
  check((await page.locator('[data-section="events"] .pulse-card').first().innerText()).includes('Ingresos personales'),'Returning to personalized mode should restore matching order');

  // Section order/visibility drafts survive resize/navigation and apply after save.
  await nav(page,'#/profile/preferences');
  const row=()=>page.locator('[data-dashboard-section="articles"]');
  await row().getByRole('button',{name:/^Subir/}).click();await settle(page);
  await page.locator('input[data-section-visibility="events"]').uncheck();
  equal(await page.locator('[data-dashboard-section]').first().getAttribute('data-dashboard-section'),'articles','Moving articles up should change draft order');
  await page.setViewportSize({width:width<1024?1440:390,height:900});await settle(page);
  equal(await page.locator('[data-dashboard-section]').first().getAttribute('data-dashboard-section'),'articles','Resize should retain draft widget order');
  await page.setViewportSize({width,height:900});await settle(page);
  await nav(page,'#/talent');await nav(page,'#/profile/preferences');
  equal(await page.locator('input[data-section-visibility="events"]').isChecked(),false,'Navigation should retain visibility draft');
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
  await nav(page,'#/pulse');
  equal(await page.locator('[data-section]').evaluateAll(nodes=>nodes.map(n=>n.dataset.section)),['articles','opportunities','saved'],'Saved layout should reorder and hide events');
  await page.locator('#pulse-filter-events').click();await settle(page);
  equal(await page.locator('.pulse-card').count(),D.pulse.filter(item=>item.category==='events').length,'Hidden event widget should not hide the event category');
  await page.locator('#pulse-filter-all').click();await settle(page);
  await nav(page,'#/profile/preferences');
  await page.locator('[data-dashboard-section="opportunities"]').getByRole('button',{name:/^Subir/}).click();await settle(page);
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();await settle(page);
  await nav(page,'#/profile/preferences');
  equal(await page.locator('[data-dashboard-section]').first().getAttribute('data-dashboard-section'),'articles','Cancel should discard the staged reordering');
  for(const checkbox of await page.locator('input[data-section-visibility]').all()) await checkbox.uncheck();
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
  await nav(page,'#/pulse');
  equal(await page.locator('[data-section]').count(),0,'All hidden widgets should show an empty dashboard');
  check(await page.getByRole('button',{name:'Restaurar secciones',exact:true}).isVisible(),'Empty dashboard should provide recovery');
  await page.getByRole('button',{name:'Restaurar secciones',exact:true}).click();await settle(page);
  equal(await page.locator('[data-section]').evaluateAll(nodes=>nodes.map(n=>n.dataset.section)),['events','articles','opportunities','saved'],'Restore should reinstate the default layout');
  check((await page.locator('[data-section="events"]').innerText()).includes('Por tu interés en Finanzas'),'Restore layout should preserve saved topic selection');

  // No topics or an opted-out user gets stable general content and no match labels.
  await nav(page,'#/profile/preferences');
  for(const checkbox of await page.locator('input[name^="topics-"]').all()) await checkbox.uncheck();
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);
  await nav(page,'#/pulse');
  equal(await page.getByRole('button',{name:'Todo el campus',exact:true}).getAttribute('aria-pressed'),'true','No selected topics should use general content');
  equal(await page.locator('.pulse-reason').count(),0,'General content should not display personal match reasons');
  await nav(page,'#/profile/preferences');
  await page.locator('input[name="topics-events"][value="finance"]').check();await page.locator('#preferences-enabled').uncheck();
  await page.getByRole('button',{name:'Guardar preferencias',exact:true}).click();await settle(page);await nav(page,'#/pulse');
  equal(await page.getByRole('button',{name:'Todo el campus',exact:true}).getAttribute('aria-pressed'),'true','Disabled personalization should use general content');
  equal(await page.locator('.pulse-reason').count(),0,'Opted-out content should not show personalized labels');

  // Article detail remains an overview and its full content opens separately.
  const article=D.pulse.find(item=>item.category==='news');
  await nav(page,'#/pulse/'+article.id);
  const articleMain=page.locator('.selected-content');
  check((await articleMain.innerText()).includes(article.summary),'Article should present its short summary');
  for(const id of article.topics) check((await articleMain.innerText()).includes(C.topicTaxonomy.find(topic=>topic.id===id).label),'Article overview should expose its topic '+id);
  const full=articleMain.getByRole('link',{name:'Leer artículo completo',exact:true});
  equal(await full.count(),1,'Article should have a read-full action');
  equal(await articleMain.locator('.prose').count(),0,'Pulse article overview should not render the full body');
  const popupEvent=page.waitForEvent('popup');await full.click();const articleSource=await popupEvent;
  await articleSource.waitForLoadState('load');
  check((await articleSource.locator('body').innerText()).includes(article.title),'Read-full action should open the matching source');
  check((await articleSource.locator('body').innerText()).toLowerCase().includes('ficticio'),'Source should identify the example content');
  await articleSource.close();

  // Internship detail presents a brief overview and opens the full source.
  const opportunity=D.pulse.find(item=>item.category==='opportunities');
  await nav(page,'#/pulse/'+opportunity.id);
  const jobMain=page.locator('.selected-content');
  check((await jobMain.innerText()).includes(opportunity.summary),'Internship should present its overview');
  const more=jobMain.getByRole('link',{name:'Saber más',exact:true});equal(await more.count(),1,'Internship should expose its source CTA');
  equal(await jobMain.locator('.prose').count(),0,'Pulse opportunity overview should not render full requirements');
  const jobPopup=page.waitForEvent('popup');await more.click();const jobSource=await jobPopup;await jobSource.waitForLoadState('load');
  check((await jobSource.locator('body').innerText()).includes(opportunity.title),'Opportunity CTA should open the matching full source');
  await jobSource.close();

  // All category contents stay available regardless of widget personalization.
  await nav(page,'#/pulse');
  await page.locator('[data-widget="opportunities"] button[data-filter]').click();await settle(page);
  const categoryPosition=await page.evaluate(()=>({pill:document.querySelector('#pulse-filter-opportunities').getBoundingClientRect().top,header:document.querySelector('.topbar').getBoundingClientRect().bottom,results:document.querySelector('#results').getBoundingClientRect().top,height:innerHeight}));
  check(categoryPosition.pill>=categoryPosition.header-1 && categoryPosition.pill<categoryPosition.height,'Widget drill-down should keep the selected category visible');
  check(categoryPosition.results>=categoryPosition.header-1 && categoryPosition.results<categoryPosition.height,'Widget drill-down should present the category from its beginning');
  await page.locator('#pulse-filter-all').click();await settle(page);
  await page.locator('#pulse-filter-events').click();await settle(page);
  equal(await page.locator('.pulse-card').count(),D.pulse.filter(item=>item.category==='events').length,'Category should show every event/workshop');
  check((await page.locator('main').innerText()).includes('Storytelling'),'Events should include the requested storytelling workshop');
  await page.locator('#pulse-filter-opportunities').click();await settle(page);
  equal(await page.locator('.pulse-card').count(),D.pulse.filter(item=>item.category==='opportunities').length,'Opportunity category should expose every internship');
  check((await page.locator('main').innerText()).includes('Nexo Capital'),'Internship cards should identify their company');
  await page.locator('#pulse-filter-all').click();await settle(page);

  // Save behavior updates the dedicated widget and remains independent of topics.
  await nav(page,'#/pulse/'+D.pulse[0].id);
  await page.locator('.selected-content [data-save]').click();await settle(page);
  await nav(page,'#/pulse');
  check((await page.locator('[data-section="saved"]').innerText()).includes(D.pulse[0].title),'Saved widget should show the bookmarked publication');
  const savedButton=page.locator('[data-section="saved"] [data-save]').first();
  await savedButton.focus();await page.keyboard.press('Enter');await settle(page);
  equal(await page.locator('[data-section="saved"] .pulse-card').count(),0,'Unbookmarking in the saved widget should remove its card');
  equal(await page.evaluate(()=>document.activeElement.id),'widget-saved-heading','Removing a saved card should keep keyboard focus in its widget');
  await page.locator('[data-action="reset"]:visible').first().click();await settle(page);
  equal(await page.locator('[data-section="saved"] .pulse-card').count(),0,'Reset should clear the saved widget');
 }finally{await page.close();}
}
(async()=>{
 const b=await chromium.launch({headless:true,...(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{})});
 try{await flow(b,390);await flow(b,1440);equal(errors,[],'F2 should have no browser runtime errors');console.log(`PASS: ${checks} F2 Pulse assertions across mobile and desktop.`);}
 finally{await b.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

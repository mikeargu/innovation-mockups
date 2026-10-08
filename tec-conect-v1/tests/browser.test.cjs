// Optional browser acceptance checks. Runtime prototype has no npm dependencies.
// Run with Playwright available to Node; set TEC_CHROMIUM to an existing binary if needed.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.TEC_URL || 'http://127.0.0.1:8765/';
const data = require('../data.js');
const browserErrors = [];
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const equal = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };

async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function open(page, hash) {
  await page.goto(base + hash);
  await page.locator('main h1').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}
async function click(page, selector) { await page.locator(selector).click(); await settle(page); }
async function submit(page) { await page.getByRole('button', {name:'Enviar solicitud',exact:true}).click(); await settle(page); }
async function nav(page, area) { await click(page, `nav a[href="#/${area}"]:visible`); }

async function walkthroughs(browser, width) {
  const page = await browser.newPage({ viewport: {width,height:844} });
  page.on('pageerror', e=>browserErrors.push(e.message));
  try {
    // Campus Pulse: browse position, saved state, keyboard focus, category navigation.
    await open(page,'#/pulse');
    const last = page.locator('.pulse-card').last().locator('h3 a');
    await last.scrollIntoViewIfNeeded(); await settle(page);
    const scrollBefore = await page.evaluate(()=>scrollY);
    await last.click(); await settle(page);
    await page.goBack(); await settle(page);
    equal(await page.evaluate(()=>location.hash),'#/pulse','Browser back should return to Pulse');
    check(Math.abs(await page.evaluate(()=>scrollY)-scrollBefore)<3,'Pulse browsing position should be restored');
    await click(page,'#pulse-filter-events');
    equal(await page.locator('.pulse-card').count(),data.pulse.filter(item=>item.category==='events').length,'Event filter should show all fictional events');
    check((await page.locator('#live').innerText()).includes('publicaciones'),'Pulse filter announcement must name publications');
    const selectedEventId=await page.locator('.pulse-card').first().getAttribute('data-item');
    await click(page,'.pulse-card:first-child h3 a');
    const save = page.locator('.selected-content [data-save]');
    await save.focus(); await page.keyboard.press('Enter'); await settle(page);
    equal(await page.locator('.selected-content [data-save]').getAttribute('aria-pressed'),'true','Saving should update visible state');
    equal(await page.evaluate(()=>document.activeElement.dataset.save),selectedEventId,'Keyboard focus should stay on the save action');
    await page.keyboard.press('Enter'); await settle(page);
    equal(await page.locator('.selected-content [data-save]').getAttribute('aria-pressed'),'false','Saving again should remove bookmark');
    await click(page,'.selected-content [data-save]');
    await nav(page,'talent'); await nav(page,'pulse');
    equal(await page.locator('#pulse-filter-events').getAttribute('aria-pressed'),'true','Category should survive navigation');
    check((await page.locator('.saved-count').innerText()).includes('1 guardados'),'Saved count should survive navigation');
    await nav(page,'mentor');
    await page.locator('#topic-filter').selectOption('Estadística aplicada'); await settle(page);

    // Talent: search, empty results, required validation, draft persistence, pending state.
    await nav(page,'talent');
    await page.locator('#people-search').fill('zzzz-no-coincidencia'); await settle(page);
    equal(await page.locator('.person-card').count(),0,'An unmatched search should have zero results');
    check(await page.locator('.empty-state').isVisible(),'Empty results should offer a recovery action');
    await click(page,'[data-action="clear-filters"]');
    equal(await page.locator('.person-card').count(),data.people.length,'Clear filters should restore every person');
    equal(await page.evaluate(()=>document.activeElement.id),'people-search','Clear filters should return keyboard focus to search');
    await nav(page,'pulse');
    equal(await page.locator('#pulse-filter-events').getAttribute('aria-pressed'),'true','Clearing Talent search must preserve the Pulse category');
    await nav(page,'mentor');
    equal(await page.locator('#topic-filter').inputValue(),'Estadística aplicada','Clearing Talent search must preserve the mentor topic');
    await nav(page,'talent');
    await page.locator('#people-search').fill('LUCIA');
    await page.locator('#skill-filter').selectOption('UX/UI'); await settle(page);
    equal(await page.locator('.person-card').count(),1,'Search should combine with the skill filter and ignore accents');
    await click(page,'.person-card h3 a');
    await page.getByRole('link',{name:'Enviar solicitud de contacto',exact:true}).click(); await settle(page);
    await submit(page);
    equal(await page.locator('#message').getAttribute('aria-invalid'),'true','Blank contact message should be invalid');
    await page.locator('#message').fill('   '); await submit(page);
    equal(await page.locator('#message').getAttribute('aria-invalid'),'true','Whitespace contact message should be invalid');
    const message='Hola Lucía. Me gustaría colaborar en tu proyecto. <b>Texto literal</b>';
    await page.locator('#message').fill(message);
    await page.setViewportSize({width:width<1024?1440:390,height:844}); await settle(page);
    equal(await page.locator('#message').inputValue(),message,'Resizing should preserve the contact draft');
    await page.setViewportSize({width,height:844}); await settle(page);
    await click(page,'.selected-content .back-link');
    await page.getByRole('link',{name:'Enviar solicitud de contacto',exact:true}).click(); await settle(page);
    equal(await page.locator('#message').inputValue(),message,'Profile navigation should preserve the contact draft');
    await submit(page);
    equal(await page.evaluate(()=>scrollY),0,'Successful contact submission should show confirmation from the top');
    check((await page.locator('.selected-content .pending').innerText()).includes('Pendiente de aceptación'),'Contact request should show pending status');
    equal(await page.locator('.user-message').innerText(),message,'Confirmation should show the submitted message');
    equal(await page.locator('.user-message b').count(),0,'User text must remain literal, not markup');
    await click(page,'.selected-content .back-link');
    await page.getByRole('link',{name:'Ver solicitud pendiente',exact:true}).click(); await settle(page);
    equal(await page.locator('#request-form').count(),0,'An already submitted contact cannot be sent again');
    await nav(page,'talent');
    equal(await page.locator('#people-search').inputValue(),'LUCIA','Talent query should be preserved');
    equal(await page.locator('#skill-filter').inputValue(),'UX/UI','Talent skill should be preserved');

    // Skip-link must focus content without replacing the current app route.
    await page.locator('.skip-link').focus(); await page.keyboard.press('Enter'); await settle(page);
    equal(await page.evaluate(()=>location.hash),'#/talent','Skip link must not change the selected area');
    equal(await page.evaluate(()=>document.activeElement.id),'main','Skip link should focus main content');

    // Mentor: both required inputs, retained goal/modality, pending, no duplicate submission.
    await nav(page,'mentor');
    await page.locator('#topic-filter').selectOption('Estadística aplicada'); await settle(page);
    equal(await page.locator('.person-card').count(),1,'Mentor topic filter should narrow the directory');
    await click(page,'.person-card h3 a');
    await page.getByRole('link',{name:'Solicitar orientación',exact:true}).click(); await settle(page);
    await submit(page);
    equal(await page.locator('.field-error').count(),2,'Mentoring form should validate goal and modality');
    const goal='Quiero revisar mi portafolio y explicar mis decisiones de diseño.';
    await page.locator('#goal').fill(goal); await submit(page);
    equal(await page.locator('#modality-error').count(),1,'A goal alone should not submit mentoring');
    await page.getByRole('radio',{name:'En línea',exact:true}).check();
    await page.setViewportSize({width:width<1024?1440:390,height:844}); await settle(page);
    equal(await page.locator('#goal').inputValue(),goal,'Resizing should preserve mentor goal');
    check(await page.getByRole('radio',{name:'En línea',exact:true}).isChecked(),'Resizing should preserve modality');
    await page.setViewportSize({width,height:844}); await settle(page);
    await click(page,'.selected-content .back-link');
    await page.getByRole('link',{name:'Solicitar orientación',exact:true}).click(); await settle(page);
    equal(await page.locator('#goal').inputValue(),goal,'Navigation should preserve mentor goal');
    check(await page.getByRole('radio',{name:'En línea',exact:true}).isChecked(),'Navigation should preserve modality');
    await submit(page);
    equal(await page.evaluate(()=>scrollY),0,'Successful mentor submission should show confirmation from the top');
    check((await page.locator('.selected-content .pending').innerText()).includes('Pendiente de aceptación'),'Mentor request should show pending status');
    equal(await page.locator('.user-message').innerText(),goal,'Confirmation should show the goal');
    check((await page.locator('.summary-modality').innerText()).includes('En línea'),'Confirmation should show chosen modality');
    await click(page,'.selected-content .back-link');
    await page.getByRole('link',{name:'Ver solicitud pendiente',exact:true}).click(); await settle(page);
    equal(await page.locator('#request-form').count(),0,'An already submitted mentor request cannot be sent again');

    // Reset clears all areas, while refresh returns a fresh demo session.
    await page.locator('[data-action="reset"]:visible').first().click(); await settle(page);
    equal(await page.evaluate(()=>location.hash),'#/pulse','Reset should return to Pulse');
    check((await page.locator('.saved-count').innerText()).includes('0 guardados'),'Reset should clear bookmarks');
    await nav(page,'talent');
    equal(await page.locator('#people-search').inputValue(),'','Reset should clear search');
    equal(await page.locator('#skill-filter').inputValue(),'all','Reset should clear skill filter');
    equal(await page.locator('.pending').count(),0,'Reset should clear contact requests');
    await click(page,'.person-card:first-child h3 a');
    await page.getByRole('link',{name:'Enviar solicitud de contacto',exact:true}).click(); await settle(page);
    equal(await page.locator('#message').inputValue(),'','Reset should clear contact drafts');
    await nav(page,'mentor');
    equal(await page.locator('#topic-filter').inputValue(),'all','Reset should clear mentor topic');
    equal(await page.locator('.pending').count(),0,'Reset should clear mentor requests');
    await click(page,'.person-card:first-child h3 a');
    await page.getByRole('link',{name:'Solicitar orientación',exact:true}).click(); await settle(page);
    equal(await page.locator('#goal').inputValue(),'','Reset should clear mentor drafts');
    equal(await page.locator('input[name="modality"]:checked').count(),0,'Reset should clear modality');
    await page.locator('#goal').fill(goal); await page.getByRole('radio',{name:'En línea',exact:true}).check(); await submit(page);
    await page.reload(); await page.locator('#goal').waitFor();
    equal(await page.locator('#goal').inputValue(),'','Refresh should reset the in-memory session');
    await open(page,'#/talent/missing-profile');
    equal(await page.evaluate(()=>location.hash),'#/pulse','Unknown entity route should recover to Pulse');
  } finally { await page.close(); }
}

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{})});
 try {
  await walkthroughs(browser,390);
  await walkthroughs(browser,1440);
  equal(browserErrors,[],'There should be no browser runtime errors');
  console.log(`PASS: ${checks} acceptance assertions across mobile and desktop walkthroughs.`);
 } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

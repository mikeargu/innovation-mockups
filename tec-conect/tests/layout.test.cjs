// Optional responsive acceptance checks; requires Playwright only for verification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const data = require(path.join(root, 'data.js'));
const out = path.join(root, 'review');
const base = process.env.TEC_URL || 'http://127.0.0.1:8765/';
const routes = [
  '/pulse', `/pulse/${data.pulse[0].id}`,
  '/talent', `/talent/${data.people[0].id}`, `/talent/${data.people[0].id}/contact`,
  '/mentor', '/mentor/plan', `/mentor/${data.mentors[0].id}`, `/mentor/${data.mentors[0].id}/request`,
  '/profile', '/profile/edit', '/profile/preferences',
  `/pulse/${data.pulse.find(item=>item.category==='news').id}`,
  `/pulse/${data.pulse.find(item=>item.category==='opportunities').id}`,
  `/pulse/${data.pulse.find(item=>item.kind==='event').id}/register`,
  `/pulse/${data.pulse.find(item=>item.applyMode==='local').id}/apply`
];
(async () => {
  fs.mkdirSync(out, {recursive:true});
  const browser = await chromium.launch({headless:true,...(process.env.TEC_CHROMIUM?{executablePath:process.env.TEC_CHROMIUM}:{})});
  const errors=[];
  const results=[];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e=>errors.push(e.message));
    page.on('requestfailed', r=>errors.push(r.url()+': '+r.failure().errorText));
    page.on('response', r=>{if(r.status()>=400 && !r.url().endsWith('/favicon.ico')) errors.push(r.status()+' '+r.url());});
    const targets=[...routes.map(route=>({route,url:base+'#'+route,source:false})),
      {route:'source-article',url:base+data.pulse.find(item=>item.category==='news').articleUrl,source:true},
      {route:'source-opportunity',url:base+data.pulse.find(item=>item.category==='opportunities').ctaUrl,source:true}];
    for (const width of [360,390,430,768,1024,1440]) {
      await page.setViewportSize({width,height:width<768?844:960});
      for (const target of targets) {
        const route=target.route;
        await page.goto(target.url);
        await page.waitForFunction(()=>!!window.TecState && document.querySelector('main')?.innerText.length>60);
        await page.evaluate(()=>document.fonts.ready);
        await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        const info=await page.evaluate(()=>({
          width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
          horizontal:document.body.scrollWidth,
          poppins:[...document.fonts].some(f=>f.family==='Poppins' && f.status==='loaded'),
          symbols:[...document.fonts].some(f=>f.family.replaceAll('"','')==='Material Symbols Rounded' && f.status==='loaded'),
          nav:[...document.querySelectorAll('nav')].filter(n=>n.getBoundingClientRect().width>0).map(n=>n.innerText),
          title:document.title,
          text:document.querySelector('main').innerText,
          textareas:document.querySelectorAll('textarea').length
        }));
        assert.ok(info.scrollWidth<=width+1 && info.horizontal<=width+1, `Horizontal overflow ${width}px ${route}: ${info.scrollWidth}/${info.horizontal}`);
        assert.ok(info.poppins, `Poppins not loaded ${route}`);
        assert.ok(info.symbols, `Material Symbols not loaded ${route}`);
        const wordmark=await page.locator('.wordmark:visible').first().boundingBox();
        assert.ok(wordmark && wordmark.height>=44, `Wordmark touch target below44px at ${width}: ${wordmark?.height}`);
        if(!target.source) assert.ok(info.nav.some(n=>n.includes('Campus Pulse') && n.includes('Talent Network') && n.includes('Mentor Match')), `Missing shared navigation at ${width}`);
        if (route.endsWith('/contact') || route.endsWith('/request')) assert.equal(info.textareas,1,'Missing request form '+route);
        await page.evaluate(()=>document.activeElement.blur());
        if (route==='/pulse') await page.screenshot({path:path.join(out,`${width}-pulse.png`),fullPage:false});
        if ((width===390 || width===1440) && route.includes('/talent/')) await page.screenshot({path:path.join(out,`${width}-talent-${route.endsWith('/contact')?'contact':'detail'}.png`),fullPage:false});
        if ((width===390 || width===1440) && route.startsWith('/profile')) await page.screenshot({path:path.join(out,`${width}-${route.slice(1).replaceAll('/','-')}.png`),fullPage:false});
        if ((width===390 || width===1440) && target.source) await page.screenshot({path:path.join(out,`${width}-${route}.png`),fullPage:false});
        results.push({width,route,overflow:false});
      }
    }
    assert.deepEqual(errors,[], 'Browser runtime/assets errors');
    await page.goto('file://'+path.join(root,'index.html')+'#/pulse');
    await page.waitForFunction(()=>!!window.TecState && document.querySelector('main')?.innerText.length>60);
    await page.evaluate(()=>document.fonts.ready);
    assert.ok(await page.locator('body').innerText().then(t=>t.includes(data.pulse[0].title)), 'Direct file opening failed');
    assert.deepEqual(errors,[],'Direct file browser errors');
    fs.writeFileSync(path.join(out,'layout-check.json'),JSON.stringify({status:'PASS',checks:results,directFile:true,errors},null,2));
    console.log(`PASS: ${results.length} route/viewport checks at six widths, local fonts, shared navigation, direct file opening, zero runtime errors.`);
  } finally { await browser.close(); }
})().catch(e=>{console.error(e.stack);process.exitCode=1;});

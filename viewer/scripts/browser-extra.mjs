import { chromium,expect } from '@playwright/test';
import { writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
const url=process.env.LAB_URL||'http://127.0.0.1:5173/';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:960}});
const page=await context.newPage();const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await page.addInitScript(()=>{
  window.__testGains=[];
  const Native=window.AudioContext;
  window.AudioContext=class extends Native{createGain(){const gain=super.createGain();window.__testGains.push(gain);return gain;}};
});
const snap=()=>page.evaluate(()=>window.__LAB_TEST__());
const gain=()=>page.evaluate(()=>window.__testGains[0]?.gain.value??null);
const settle=()=>page.waitForTimeout(800);
const check=name=>{checks.push(name);console.log('PASS '+name);};
try{
  await page.goto(url);await expect(page.locator('.scene-meta')).toContainText('19/19 meshes loaded');await settle();
  const cameraPositions={};for(const view of ['Front','Back','Left','Right','Iso']){await page.getByRole('button',{name:view,exact:true}).click();await settle();cameraPositions[view]=(await snap()).camera;}
  expect(cameraPositions.Front[2]).toBeGreaterThan(100);expect(cameraPositions.Back[2]).toBeLessThan(-100);expect(cameraPositions.Left[0]).toBeLessThan(-100);expect(cameraPositions.Right[0]).toBeGreaterThan(100);check('Front/back/left/right/isometric camera views');
  await page.getByRole('button',{name:'↻ Orbit',exact:true}).click();await expect(page.getByRole('button',{name:'↻ Orbit',exact:true})).toHaveAttribute('aria-pressed','true');
  const canvas=await page.locator('canvas').boundingBox();await page.mouse.move(canvas.x+canvas.width*.7,canvas.y+canvas.height*.4);await page.mouse.down();await page.mouse.move(canvas.x+canvas.width*.6,canvas.y+canvas.height*.5,{steps:12});await page.mouse.up();await expect(page.getByRole('button',{name:'↻ Orbit',exact:true})).toHaveAttribute('aria-pressed','false');
  const beforeZoom=(await snap()).camera;await page.mouse.wheel(0,-220);await settle();expect((await snap()).camera).not.toEqual(beforeZoom);check('Orbit drag / wheel zoom, with auto-rotation stopping on interaction');
  await page.getByRole('button',{name:'Front',exact:true}).click();await settle();await page.locator('[data-part-id="cap-B"]').click();await page.getByRole('button',{name:'Hide',exact:true}).first().click();await settle();
  const state=await snap(),sw=state.parts.find(p=>p.id==='switch-B'),rect=await page.locator('canvas').boundingBox();await page.mouse.click(rect.x+sw.screen[0],rect.y+sw.screen[1]);await expect(page.locator('.inspector h2')).toHaveText('B · left index switch');check('Hidden cap does not intercept selection of the switch beneath');
  await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await page.getByRole('button',{name:'X-ray',exact:true}).click();await page.getByLabel('Low effects',{exact:true}).check();await settle();await page.screenshot({path:resolve('test-results/xray.png')});await page.getByRole('button',{name:'Solid',exact:true}).click();check('X-ray display and low-effects rendering');
  await page.getByRole('button',{name:'Play the signal',exact:true}).click();await page.locator('#breath').fill('50');await page.locator('.sim-key-row').getByRole('button',{name:'B',exact:true}).click();await expect(page.locator('.signal-flow strong')).toContainText('D4');expect(await gain()).toBeNull();
  await page.getByRole('button',{name:'Enable sound',exact:true}).click();await page.waitForTimeout(180);expect(await gain()).toBeGreaterThan(0);await page.getByRole('button',{name:'Power on',exact:true}).click();await page.waitForTimeout(80);expect(await gain()).toBeLessThan(.00001);await page.getByRole('button',{name:'Power off',exact:true}).click();await page.waitForTimeout(180);expect(await gain()).toBeGreaterThan(0);
  // Exercise the browser visibility handler deterministically; no hardware input.
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await expect(page.getByRole('button',{name:'Enable sound',exact:true})).toBeVisible();await page.waitForTimeout(180);expect(await gain()).toBe(0);await page.evaluate(()=>delete document.hidden);
  await page.locator('.sim-key-row').getByRole('button',{name:'ff',exact:true}).click();await expect(page.locator('.signal-flow strong')).toHaveText('Unsupported state');await page.screenshot({path:resolve('test-results/simulation.png')});check('Full +3 transposition, unsupported FF state, audio opt-in and zero gain on power-off / hidden-event handler');
  const broken=await context.newPage();await broken.route('**/assets/models/5_Eb.stl',route=>route.fulfill({status:200,contentType:'application/octet-stream',body:Buffer.alloc(50)}));await broken.goto(url);await expect(broken.getByRole('alert')).toContainText('5_Eb.stl');await expect(broken.locator('.scene-meta')).toContainText('18/19 meshes loaded');expect(await broken.evaluate(()=>window.__LAB_TEST__().triangles)).toBeGreaterThan(600000);await broken.close();check('Malformed-mesh response shows an error while the remaining WebGL scene renders');
  const reduced=await browser.newContext({viewport:{width:1000,height:800},reducedMotion:'reduce'});const reducedPage=await reduced.newPage();await reducedPage.goto(url);await expect(reducedPage.locator('.scene-meta')).toContainText('19/19 meshes loaded');await expect(reducedPage.getByRole('button',{name:'↻ Orbit',exact:true})).toBeDisabled();await reduced.close();check('Reduced-motion preference disables automatic orbit');
  expect(errors).toEqual([]);await writeFile('test-results/browser-extra-report.json',JSON.stringify({checks,errors,cameraPositions},null,2));console.log(`${checks.length} extra browser checks passed.`);
}catch(error){await page.screenshot({path:'test-results/extra-failure.png'});await writeFile('test-results/browser-extra-failure.json',JSON.stringify({checks,errors,failure:String(error)},null,2));throw error;}finally{await browser.close();}

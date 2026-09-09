import { chromium,expect } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const url=process.env.LAB_URL||'http://127.0.0.1:5173/';
const output=resolve('test-results');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const page=await context.newPage();const consoleMessages=[],errors=[],failedRequests=[],externalRequests=[];const checks=[];
page.on('console',m=>{consoleMessages.push({type:m.type(),text:m.text()});if(m.type()==='error')errors.push(m.text());});
page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
page.on('request',r=>{if(!r.url().startsWith(new URL(url).origin)&&!r.url().startsWith('data:'))externalRequests.push(r.url());});
const check=(name)=>{checks.push(name);console.log('PASS '+name);};
const snapshot=()=>page.evaluate(()=>window.__LAB_TEST__());
const settle=()=>page.waitForTimeout(850);
const tree=id=>page.locator(`[data-part-id="${id}"]`);
const slider=async(selector,value)=>{await page.locator(selector).fill(String(value));await page.locator(selector).dispatchEvent('input');await page.locator(selector).dispatchEvent('change');await settle();};
try{
  await page.goto(url);await expect(page.locator('.scene-meta')).toContainText('19/19 meshes loaded');await settle();
  await expect(page.getByLabel('CONFIGURATION',{exact:true})).toHaveValue('full');
  const baseline=await snapshot();expect(baseline.parts.filter(p=>p.id.startsWith('cap-'))).toHaveLength(21);expect(baseline.triangles).toBeGreaterThan(600000);
  await page.screenshot({path:resolve(output,'assembled.png')});check('Default full WebGL scene: 21 caps, 22 switches, 19 assets');
  await tree('teensy').click();await expect(page.locator('.inspector h2')).toHaveText('Teensy 4.1 · the brain');await expect(tree('teensy')).toHaveClass(/selected/);check('Tree selection and inspector agree');
  await page.getByRole('button',{name:'Show connections',exact:true}).click();await page.getByLabel('Mechanical attachment').uncheck();await page.getByLabel('Key & sensor signals').uncheck();await settle();
  const displayed=await snapshot();expect(displayed.paths.length).toBeGreaterThan(2);for(const path of displayed.paths){expect(path.segments).toBe(32);const edge=displayed.connections.find(e=>e.id===path.id);path.from.forEach((n,i)=>expect(n).toBeCloseTo(edge.from[i],2));path.to.forEach((n,i)=>expect(n).toBeCloseTo(edge.to[i],2));}
  await page.screenshot({path:resolve(output,'selected-connections.png')});check('Connection toggles and selected-component labels');
  await slider('#explode',100);await page.getByRole('button',{name:'Reset view',exact:true}).click();await settle();
  const exploded=await snapshot();expect(exploded.parts.find(p=>p.id==='cap-B').world).not.toEqual(baseline.parts.find(p=>p.id==='cap-B').world);
  for(const edge of exploded.connections){expect(edge.from?.every(Number.isFinite)).toBe(true);expect(edge.to?.every(Number.isFinite)).toBe(true);}
  expect(exploded.connections.find(e=>e.id==='i2s').from).not.toEqual(baseline.connections.find(e=>e.id==='i2s').from);
  expect(exploded.paths.every(p=>p.segments===32)).toBe(true);
  await page.screenshot({path:resolve(output,'exploded.png')});check('Continuous explosion moves parts and anchored graph endpoints');
  for(let i=0;i<3;i++){await slider('#explode',0);await slider('#explode',100);}await slider('#explode',0);
  const restored=await snapshot();for(const p of baseline.parts){const q=restored.parts.find(v=>v.id===p.id);p.world.forEach((n,i)=>expect(q.world[i]).toBeCloseTo(n,2));}check('Three rendered explosion/reassembly cycles return without drift');
  await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await settle();
  const clickScene=await snapshot(),chip=clickScene.parts.find(p=>p.id==='teensy'),bounds=await page.locator('canvas').boundingBox();expect(clickScene.selected).toBeNull();await page.mouse.click(bounds.x+chip.screen[0],bounds.y+chip.screen[1]);await expect(page.locator('.inspector h2')).toHaveText('Teensy 4.1 · the brain');check('Raycast selection changes an unselected scene to the clicked mesh');
  await tree('cap-B').click();await page.getByRole('button',{name:'Isolate',exact:true}).click();await settle();
  const isolated=await snapshot();expect(isolated.parts.filter(p=>p.visible).map(p=>p.id)).toEqual(['cap-B']);
  await page.getByRole('button',{name:'Hide',exact:true}).first().click();await expect(tree('cap-B')).toHaveClass(/hidden-part/);await page.getByRole('button',{name:'Restore all',exact:true}).click();await settle();check('Isolation, hide and restore all');
  await tree('teensy').click();await page.getByRole('button',{name:'Ghost others',exact:true}).click();await page.getByRole('button',{name:'Fit selection',exact:false}).click();await settle();
  const focused=await snapshot();const target=focused.parts.find(p=>p.id==='teensy');const canvasBox=await page.locator('canvas').boundingBox();
  await page.mouse.click(canvasBox.x+target.screen[0],canvasBox.y+target.screen[1]);await expect(page.locator('.inspector h2')).toHaveText('Teensy 4.1 · the brain');check('Actual mesh click with ghosted surrounding parts');
  await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await settle();
  await tree('cap-B').click();await page.getByRole('button',{name:'Open close-up',exact:true}).click();await settle();await page.screenshot({path:resolve(output,'cap-switch-closeup.png')});await page.getByRole('button',{name:'Press cap',exact:true}).click();await settle();const down=await snapshot();await page.getByRole('button',{name:'Release cap',exact:true}).click();await settle();const up=await snapshot();expect(up.parts.find(p=>p.id==='cap-B').local[2]-down.parts.find(p=>p.id==='cap-B').local[2]).toBeCloseTo(2,1);expect(up.parts.filter(p=>p.visible)).toHaveLength(2);check('Cap/switch close-up and press/release');
  await page.getByLabel('CONFIGURATION',{exact:true}).selectOption('bench');await settle();await expect(page.locator('.scene-meta')).toContainText('19/19');const bench=await snapshot();expect(bench.parts.filter(p=>p.id.startsWith('cap-'))).toHaveLength(3);expect(bench.parts.some(p=>p.id==='imu')).toBe(false);await page.screenshot({path:resolve(output,'bench.png')});check('Separate bench scene with three caps and no IMU');
  await page.getByRole('button',{name:'Play the signal',exact:true}).click();await expect(page.locator('.signal-flow strong')).toHaveText('No breath · silent');await slider('#breath',50);await expect(page.locator('.signal-flow strong')).toContainText('C♯4');
  for(const [key,note] of [['B','B3'],['A','A3'],['G','G3']]){await page.locator('.sim-key-row').getByRole('button',{name:key,exact:true}).click();await expect(page.locator('.signal-flow strong')).toContainText(note);}
  await page.getByRole('button',{name:'Power on',exact:true}).click();await expect(page.locator('.signal-flow strong')).toHaveText('Power off · silent');await page.getByRole('button',{name:'Power off',exact:true}).click();await slider('#breath',0);await expect(page.locator('.signal-flow strong')).toHaveText('No breath · silent');
  await page.getByRole('button',{name:'Enable sound',exact:true}).click();await expect(page.getByRole('button',{name:'Mute sound',exact:true})).toBeVisible();await page.getByRole('button',{name:'Reset simulation',exact:true}).click();await expect(page.getByRole('button',{name:'Enable sound',exact:true})).toBeVisible();check('Source-traced bench sequence, zero-breath mute, power-off and sound opt-in/reset');
  await page.getByRole('button',{name:'Asset library',exact:true}).click();await page.getByRole('button',{name:'18_OctRest_Angle_PLA.stl',exact:true}).click();await settle();await expect(page.locator('.inspector h2')).toHaveText('18_OctRest_Angle_PLA.stl');expect((await snapshot()).parts).toHaveLength(1);await page.screenshot({path:resolve(output,'asset-neck.png')});check('Original-asset library and independent mesh fitting');
  await page.getByLabel('CONFIGURATION',{exact:true}).selectOption('full');await settle();await page.getByRole('button',{name:'Take the guided tour',exact:false}).click();for(let i=0;i<6;i++)await page.locator('.guide').getByRole('button',{name:'Next →',exact:true}).click();await expect(page.getByLabel('CONFIGURATION',{exact:true})).toHaveValue('bench');await page.locator('.guide').getByRole('button',{name:'Replay ↻',exact:true}).click();await expect(page.getByLabel('CONFIGURATION',{exact:true})).toHaveValue('full');await page.locator('.guide').getByRole('button',{name:'Close',exact:true}).click();check('Seven-step guided tour and replay');
  await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await page.getByRole('button',{name:'Explore assembly sequence',exact:true}).click();await page.locator('.guide').getByRole('button',{name:'Next →',exact:true}).click();await expect(page.locator('#explode')).toHaveValue('75');await page.locator('.guide').getByRole('button',{name:'Close',exact:true}).click();check('Conceptual assembly sequence and staged control');
  await page.getByRole('button',{name:'Sources & assumptions ↗',exact:true}).click();await expect(page.locator('dialog')).toBeVisible();await expect(page.locator('dialog')).toContainText('HP_VGND');await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(0);check('Sources modal, evidence and Escape dismissal');
  await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await settle();await page.setViewportSize({width:390,height:844});await settle();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button',{name:'☷ Parts',exact:true}).click();await tree('cap-B').click();await expect(page.locator('.inspector h2')).toBeVisible();await expect(page.locator('.parts-panel')).not.toBeVisible();await page.getByRole('button',{name:'ⓘ Inspector',exact:true}).click();await page.screenshot({path:resolve(output,'narrow.png')});check('390px viewport with working collapsible panels and no horizontal overflow');
  await page.setViewportSize({width:1600,height:1000});await page.getByRole('button',{name:'Restore assembly',exact:true}).click();await settle();
  // Measure browser rAF with orbit active; machine-specific, not a laptop performance claim.
  await page.getByRole('button',{name:'↻ Orbit',exact:true}).click();
  const performance=await page.evaluate(async()=>{const times=[];await new Promise(resolve=>{let previous=performance.now();const frame=now=>{times.push(now-previous);previous=now;if(times.length<90)requestAnimationFrame(frame);else resolve();};requestAnimationFrame(frame);});times.shift();times.sort((a,b)=>a-b);return {frames:times.length,medianFrameMs:times[Math.floor(times.length/2)],p95FrameMs:times[Math.floor(times.length*.95)]};});
  await page.getByRole('button',{name:'↻ Orbit',exact:true}).click();expect(errors).toEqual([]);expect(failedRequests).toEqual([]);expect(externalRequests).toEqual([]);check('No console/page errors, failed requests or external runtime requests');
  await writeFile(resolve(output,'browser-report.json'),JSON.stringify({url,viewport:{width:1600,height:1000},checks,consoleMessages,errors,failedRequests,externalRequests,performance,render:await snapshot()},null,2));
  console.log(JSON.stringify({passed:checks.length,performance,errors,failedRequests,externalRequests},null,2));
}catch(error){await page.screenshot({path:resolve(output,'failure.png')});await writeFile(resolve(output,'browser-failure.json'),JSON.stringify({checks,errors,failedRequests,externalRequests,failure:String(error)},null,2));throw error;}finally{await browser.close();}

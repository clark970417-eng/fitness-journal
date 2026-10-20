import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const port=Number(process.env.TEST_PORT||8195);
const proc=spawn(process.execPath,['serve.mjs'],{env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);proc.once('exit',code=>reject(new Error('Preview exited '+code)));});
const browser=await chromium.launch({headless:true});
const errors=[];
try {
for(const mobile of [false,true]){
 const context=await browser.newContext(mobile?devices['iPhone 13']:{viewport:{width:1200,height:1000}});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${port}/`);
 await run(page,mobile);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
 await mkdir('screenshots',{recursive:true});await page.screenshot({path:`screenshots/${mobile?'mobile':'preview'}.png`});
 await context.close();
}
assert.deepEqual(errors,[],'No uncaught browser errors');console.log('Desktop and iPhone-sized browser checks passed');
}finally{await browser.close();proc.kill();}
async function run(page,mobile){
 await page.locator('#onboarding-save').click();
 await page.locator('#today-exercises canvas').first().waitFor();
 assert.equal(await page.locator('.fitness-volume strong').innerText(),'0 kg');
 await page.locator('.today-exercise').nth(1).click();
 await page.locator('#today-exercise-editor').waitFor({state:'visible'});
 assert.equal(await page.locator('#today-edit-title').innerText(),'羅馬尼亞硬舉');
 await page.locator('#today-edit-save').click();
 await page.locator('#browse-exercises').click();
 await page.locator('#exercise-dialog').waitFor({state:'visible'});
 await page.locator('#exercise-search').fill('胸撐');
 await page.waitForTimeout(400);
 assert.ok(await page.locator('.exercise-result').count()>0,'Chest-supported rows included');
 await page.locator('#exercise-dialog button[aria-label="關閉"]').click();
 await page.locator('#start-workout').click();
 await page.locator('#summary-dialog').waitFor({state:'visible'});
 await page.locator('#save-summary').click();
 await page.waitForTimeout(400);
 assert.ok(!((await page.locator('.fitness-volume strong').innerText()).startsWith('0 ')),'Recorded volume reaches dashboard');
 await page.reload();
 await page.waitForTimeout(500);
 assert.ok(!((await page.locator('.fitness-volume strong').innerText()).startsWith('0 ')),'Training persists after reload');
}

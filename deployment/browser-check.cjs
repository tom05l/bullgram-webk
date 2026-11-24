const {chromium}=require('/tmp/casino-qa/node_modules/playwright');
const fs=require('fs');
const {webkit}=require('../node_modules/@playwright/test');
const useWebkit=process.env.WEBK_TEST_WEBKIT==='1';
const out=process.env.WEBK_TEST_OUTPUT||'reports';
(async()=>{
 const browser=useWebkit?await webkit.launch({headless:true}):await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:useWebkit?{width:390,height:844}:{width:1366,height:900},...(useWebkit?{isMobile:true,hasTouch:true}:{})});
 const errors=[],failed=[],sockets=[]; page.on('console',m=>{if(m.type()==='error')console.log('BROWSER ERROR',m.text())});
 page.on('pageerror',e=>errors.push(e.stack));
 page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 page.on('websocket',ws=>{const entry={url:ws.url(),sent:0,received:0};sockets.push(entry);ws.on('framesent',()=>entry.sent++);ws.on('framereceived',()=>entry.received++);});
 await page.goto('https://webk.duckdns.org/',{waitUntil:'domcontentloaded'});
 await page.waitForTimeout(18000);
 const first={title:await page.title(),text:(await page.locator('body').innerText()).slice(0,1800),canvases:await page.locator('canvas').count()};
 const buttons=await page.locator('button').allTextContents();
 const phone=page.getByText(/log in by phone|sign in by phone|phone number/i).last();
 if(await phone.count()){await phone.click();await page.waitForTimeout(2000);}
 const result={first,buttons,errors,failed,sockets,phoneInputs:await page.locator('input, [contenteditable="true"]').count(),finalText:(await page.locator('body').innerText()).slice(0,1800)};
 fs.writeFileSync(out+'/browser-check.json',JSON.stringify(result,null,2));
 await page.screenshot({path:out+'/login-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);
 await page.screenshot({path:out+'/login-mobile.png',fullPage:true});
 if(result.errors.length)throw Error(JSON.stringify(result.errors));
 if(result.first.title!=='Bullgram WebK'||!result.first.text.includes('QR Code')||!result.finalText.includes('Sign in to Bullgram'))throw Error('Login UI missing');
 console.log(JSON.stringify(result));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

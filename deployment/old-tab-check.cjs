const {chromium}=require('/tmp/casino-qa/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();let phase="boot";const errors=[],badHttp=[];
 page.on('pageerror',e=>errors.push({phase,message:e.message,stack:e.stack}));page.on('response',r=>{if(r.status()>=400)badHttp.push({url:r.url(),status:r.status()})});
 await page.route('https://webk.duckdns.org/',r=>r.fulfill({contentType:'text/html',body:fs.readFileSync('reports/ui-lag/previous-index.html','utf8')}));
 await page.goto('https://webk.duckdns.org/');await page.getByRole('button',{name:/log in by phone number/i}).waitFor({timeout:25000});
 phase="phone";const start=Date.now();await page.getByRole('button',{name:/log in by phone number/i}).click();await page.getByText('Sign in to Bullgram',{exact:true}).waitFor();
 const phoneClickMs=Date.now()-start;
 const imports=await page.evaluate(async()=>{
  const out=[];
  for(const path of ['/settings-B5iID3Se.js','/gifts-BfeBtxmX.js']){
   const at=performance.now();try{await import(path);out.push({path,ok:true,ms:Math.round(performance.now()-at)})}catch(e){out.push({path,ok:false,error:e.message})}
  }return out;
 });
 const result={phoneClickMs,imports,errors,badHttp};fs.writeFileSync('reports/ui-lag/old-tab.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();if(errors.length||badHttp.length||imports.some(i=>!i.ok))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});

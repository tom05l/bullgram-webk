const {chromium}=require('/tmp/casino-qa/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('https://webk.duckdns.org/?noSharedWorker=1',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.mtprotoMessagePort,{timeout:25000});
 const results=await page.evaluate(async()=>{
  const methods=[['help.getConfig',{}],['langpack.getLangPack',{lang_pack:'webk',lang_code:'en'}],['help.getCountriesList',{lang_code:'en',hash:0}],['help.getAppConfig',{hash:0}]];
  const out=[];
  for(const [method,params] of methods){
   const at=Date.now();
   try{
    const r=await Promise.race([mtprotoMessagePort.invoke('manager',{name:'apiManager',method:'invokeApi',args:[method,params],accountNumber:1}),new Promise((_,reject)=>setTimeout(()=>reject(Error('TIMEOUT')),12000))]);
    out.push({method,ok:true,type:r?._,bytes:JSON.stringify(r).length,count:r?.strings?.length||r?.countries?.length||0,ms:Date.now()-at});
   }catch(e){out.push({method,ok:false,error:e.type||e.message,ms:Date.now()-at})}
  }
  return out;
 });
 const result={results,errors};const dest=process.argv[2]||'reports/loading-audit/live-readonly.json';fs.writeFileSync(dest,JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
 if(results.some(r=>!r.ok)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});

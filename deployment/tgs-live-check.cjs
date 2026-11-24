const {chromium}=require('/tmp/casino-qa/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const browser=process.env.TGS_TEST_WEBKIT==='1'?await require('../node_modules/@playwright/test').webkit.launch({headless:true}):await chromium.launch({executablePath:'/snap/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1000,height:800}});const errors=[],badHttp=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badHttp.push({url:r.url(),status:r.status()})});
 await page.goto('https://webk.duckdns.org/?noSharedWorker=1');await page.waitForFunction(()=>window.mtprotoMessagePort&&window.lottieLoader);
 const bytes=[...fs.readFileSync(process.env.TGS_TEST_FIXTURE||'reports/tgs-fix/snowflake.tgs')];
 const attribute=process.env.TGS_TEST_STICKER==='1'?'documentAttributeSticker':'documentAttributeCustomEmoji';
 const result=await page.evaluate(async({bytes,attribute})=>{
  const invoke=(name,method,args)=>mtprotoMessagePort.invoke('manager',{name,method,args,accountNumber:1});
  const docs=[];
  for(const [i,filename] of ['0.tgs','gift-model.tgs','AnimatedSticker.tgs'].entries()){
   const doc=await invoke('appDocsManager','saveDoc',[{_: 'document',id:String(9999900+i),access_hash:'0',date:1,dc_id:2,size:bytes.length,mime_type:'application/x-tgsticker',pFlags:{},attributes:[{_: 'documentAttributeFilename',file_name:filename},{_: attribute,pFlags:{},alt:'❄️',stickerset:{_: 'inputStickerSetEmpty'}}]}]);
   docs.push({filename,type:doc.type,sticker:doc.sticker,animated:doc.animated});
  }
  const inflated=await invoke('apiFileManager','uncompressTGS',[new Uint8Array(bytes),'fixture.tgs']);
  const container=document.createElement('div');container.style.cssText='position:fixed;left:20px;top:20px;width:160px;height:160px;background:#888;z-index:99999';document.body.append(container);
  const player=await lottieLoader.loadAnimationWorker({container,animationData:new Blob([inflated],{type:'application/json'}),width:160,height:160,name:'public-emoji-regression',autoplay:false,loop:false,noOffscreen:true});
  await Promise.race([player.loadPromise,new Promise((_,r)=>setTimeout(()=>r(Error('TGS load timeout')),15000))]);
  player.requestFrame(45);
  await new Promise(r=>setTimeout(r,1500));
  const canvas=container.querySelector('canvas');const data=canvas?.getContext('2d')?.getImageData(0,0,canvas.width,canvas.height).data;
  let visiblePixels=0;if(data)for(let i=3;i<data.length;i+=4)if(data[i])visiblePixels++;
  return {docs,inflatedBytes:inflated.byteLength,visiblePixels,canvasWidth:canvas?.width};
 },{bytes,attribute});
 const output={...result,errors,badHttp};fs.writeFileSync(process.argv[2]||'reports/tgs-fix/live.json',JSON.stringify(output,null,2));await page.screenshot({path:'reports/tgs-fix/real-emoji.png'});console.log(JSON.stringify(output));await browser.close();
 if(result.docs.some(d=>d.sticker!==2)||!result.visiblePixels||errors.length||badHttp.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});

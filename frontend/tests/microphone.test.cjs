const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const resolve=Module._resolveFilename;
Module._resolveFilename=function(name,...args){return resolve.call(this,name.startsWith('@/')?path.resolve(__dirname,'../src',name.slice(2)):name,...args);};
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
after(()=>{Module._resolveFilename=resolve;});
const {createSpeechRecognizer}=require('../src/lib/speech.ts');
function withBrowser(run){
 const previousWindow=global.window,previousTimer=global.setTimeout,previousClear=global.clearTimeout;
 const timers=new Map();let native,id=0,ends=0;const texts=[],errors=[];
 class Recognition {
  constructor(){native=this;this.starts=0;this.aborts=0;}
  start(){this.starts++;}
  abort(){this.aborts++;this.onend?.();}
 }
 global.window={SpeechRecognition:Recognition};
 global.setTimeout=(cb,delay)=>{const key=++id;timers.set(key,{cb,delay});return key;};
 global.clearTimeout=key=>timers.delete(key);
 const session=createSpeechRecognizer('te',{onResult:t=>texts.push(t),onError:e=>errors.push(e),onEnd:()=>ends++});
 const harness={session,get native(){return native;},texts,errors,timers,get ends(){return ends;},restart(){const entry=Array.from(timers.entries())[0];assert.ok(entry,'a restart was scheduled');timers.delete(entry[0]);entry[1].cb();},result(parts,resultIndex=0){native.onresult({resultIndex,results:parts.map(([text,isFinal])=>Object.assign([{transcript:text}],{isFinal}))});}};
 try{run(harness);}finally{session?.abort();global.window=previousWindow;global.setTimeout=previousTimer;global.clearTimeout=previousClear;}
}
test('microphone requests continuous recognition in the selected language',()=>withBrowser(h=>{
 h.session.start();assert.equal(h.native.continuous,true);assert.equal(h.native.interimResults,true);assert.equal(h.native.lang,'te-IN');
 h.session.start();assert.equal(h.native.starts,1);
}));
test('silence ends the browser recognizer but not the user microphone session',()=>withBrowser(h=>{
 h.session.start();h.result([['నా పంట',true]]);h.native.onend();
 assert.equal(h.ends,0);assert.equal(h.timers.size,1);h.restart();assert.equal(h.native.starts,2);
 h.result([['మిర్చి',false]]);assert.equal(h.texts.at(-1),'నా పంట మిర్చి');
 h.native.onend();h.restart();h.result([['వివరించండి',true]]);assert.equal(h.texts.at(-1),'నా పంట మిర్చి వివరించండి');
}));
test('interim updates replace the current session text without losing finalized phrases or duplicating words',()=>withBrowser(h=>{
 h.session.start();h.result([['నా',false]]);h.result([['నా పంట',true],['మి',false]],1);h.result([['నా పంట',true],['మిర్చి',true]],1);
 assert.deepEqual(h.texts,['నా','నా పంట మి','నా పంట మిర్చి']);
}));
test('manual off ends capture immediately and ignores delayed results and browser end events',()=>withBrowser(h=>{
 h.session.start();h.result([['మొదటి ప్రశ్న',false]]);h.session.stop();
 assert.equal(h.native.aborts,1);assert.equal(h.ends,1);h.result([['late text',true]]);h.native.onend();
 assert.equal(h.texts.at(-1),'మొదటి ప్రశ్న');assert.equal(h.timers.size,0);assert.equal(h.ends,1);
}));
test('manual off during a scheduled restart cancels it; later microphone sessions start with a fresh transcript',()=>withBrowser(h=>{
 h.session.start();h.result([['old question',true]]);h.native.onend();h.session.stop();assert.equal(h.timers.size,0);
 h.session.start();h.result([['కొత్త ప్రశ్న',true]]);assert.equal(h.texts.at(-1),'కొత్త ప్రశ్న');
}));
test('no-speech and transient network errors restart while the user keeps the microphone on',()=>withBrowser(h=>{
 h.session.start();h.native.onerror({error:'no-speech'});h.native.onend();h.restart();
 h.native.onerror({error:'network'});h.native.onend();assert.ok(Array.from(h.timers.values())[0].delay>=1000);h.restart();
 assert.equal(h.native.starts,3);assert.equal(h.ends,0);assert.deepEqual(h.errors,[]);
}));
test('permission and hardware errors stop the session rather than endlessly restarting',()=>withBrowser(h=>{
 h.session.start();h.native.onerror({error:'not-allowed'});h.native.onend();
 assert.deepEqual(h.errors,['not-allowed']);assert.equal(h.ends,1);assert.equal(h.timers.size,0);
}));
test('cleanup abort cancels pending restarts and cannot reopen the microphone',()=>withBrowser(h=>{
 h.session.start();h.native.onend();h.session.abort();h.native.onend();assert.equal(h.timers.size,0);assert.equal(h.ends,1);
}));
test('unsupported browsers return no recognizer and never insert a demonstration question',()=>{
 const previous=global.window;global.window={};let results=0;
 try{assert.equal(createSpeechRecognizer('en',{onResult:()=>results++,onEnd:()=>{},onError:()=>{}}),null);assert.equal(results,0);}finally{global.window=previous;}
});

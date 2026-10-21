const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name,...args) { return resolve.call(this,name.startsWith('@/')?path.resolve(__dirname,'../src',name.slice(2)):name,...args); };
require.extensions['.ts'] = (module,filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
const {classifyImageObjects, clearlyIrrelevantObject, documentScene, agriculturalScene} = require('../src/lib/localImageModel.ts');
const {performOcr} = require('../src/lib/ocrEngine.ts');
const {classifyIntent} = require('../src/lib/aiCopilotService.ts');
function metrics(expected,predicted) {
  const labels=[...new Set([...expected,...predicted])];
  const perClass=labels.map(label=>{const tp=expected.filter((e,i)=>e===label&&predicted[i]===label).length;
    const fp=expected.filter((e,i)=>e!==label&&predicted[i]===label).length, fn=expected.filter((e,i)=>e===label&&predicted[i]!==label).length;
    const precision=tp/(tp+fp)||0, recall=tp/(tp+fn)||0; return {label,tp,fp,fn,precision,recall,f1:2*precision*recall/(precision+recall)||0};});
  return {sampleCount:expected.length,accuracy:expected.filter((e,i)=>e===predicted[i]).length/(expected.length||1),precision:perClass.reduce((s,c)=>s+c.precision,0)/labels.length,recall:perClass.reduce((s,c)=>s+c.recall,0)/labels.length,f1:perClass.reduce((s,c)=>s+c.f1,0)/labels.length,perClass};
}
function distance(a,b) { let prev=Array.from({length:b.length+1},(_,i)=>i); for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}return prev[b.length]; }
(async()=>{
  const report={evaluatedAt:new Date().toISOString(),scope:'Small fixture audit and in-sample intent audit; not representative held-out benchmark results.',models:[]};
  const expected=[],predicted=[],latencies=[];
  for(const [name,label] of [['scheme-poster.png','document'],['scheme-table.png','document'],['room.jpg','unrelated']]) {
    const file=path.resolve(__dirname,'../.ai-test-fixtures',name);if(!fs.existsSync(file))continue;
    const start=Date.now(), predictions=await classifyImageObjects(fs.readFileSync(file));latencies.push(Date.now()-start);
    expected.push(label);predicted.push(clearlyIrrelevantObject(predictions)?'unrelated':documentScene(predictions)?'document':agriculturalScene(predictions)?'agriculture':'abstain');
  }
  report.models.push({name:'CLIP ViT-B/32 q8',type:'Pretrained deep learning vision model',...metrics(expected,predicted),latencyMs:latencies,limitation:'Three previously used fixtures; abstentions count as errors. Includes loading time. Not a disease diagnosis benchmark.'});
  const sharp=require('sharp'), truth='Government Agriculture Scheme\nApplicant Ravi\nRequired documents Income certificate';
  const svg='<svg width="1000" height="280"><rect width="100%" height="100%" fill="white"/>'+truth.split('\n').map((line,i)=>`<text x="40" y="${65+i*70}" font-size="36" font-family="Arial" fill="black">${line}</text>`).join('')+'</svg>';
  const image=await sharp(Buffer.from(svg)).png().toBuffer(), start=Date.now();
  const text=await performOcr('data:image/png;base64,'+image.toString('base64'));
  const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  report.models.push({name:'Tesseract LSTM OCR',type:'Pretrained neural OCR',sampleCount:1,characterErrorRate:distance(norm(truth),norm(text))/norm(truth).length,latencyMs:[Date.now()-start],limitation:'One clean synthetic English notice; not representative of photographed, multilingual or blurry documents.'});
  const queries=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../dataset/conversational_nlp/intent_entity_queries.json'),'utf8'));
  const sample=Array.from({length:128},(_,i)=>queries[Math.floor(i*(queries.length-1)/127)]), started=Date.now();
  report.models.push({name:'Hashed-vector intent centroid classifier',type:'Classical classifier; not deep learning',...metrics(sample.map(q=>q.intent),sample.map(q=>classifyIntent(q.query_text).intent)),latencyMs:[Date.now()-started],limitation:'128 examples from the training-source dataset; an in-sample audit, not held-out accuracy. This legacy classifier is not used by the current chat intent router.'});
  for(const name of ['Gemini / Groq / OpenAI language and vision providers','Gemini TTS']) report.models.push({name,type:'External generative model',sampleCount:0,accuracy:null,precision:null,recall:null,f1:null,limitation:'No labeled live-provider evaluation completed. Actual request latency, tokens and failures are displayed separately.'});
  fs.writeFileSync(path.resolve(__dirname,'../src/lib/data/model_evaluation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.models.map(m=>({model:m.name,samples:m.sampleCount,accuracy:m.accuracy,cer:m.characterErrorRate}))));
})().catch(e=>{console.error(e.message);process.exitCode=1;});

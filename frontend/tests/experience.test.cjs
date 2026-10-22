const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const realFetch = global.fetch;
const env = { ...process.env };
for (const key of ['GEMINI_API_KEY','GOOGLE_API_KEY','GOOGLE_GENERATIVE_AI_API_KEY','VISION_API_KEY','API-Key','API KEY','GROQ_API_KEY','OPENAI_API_KEY']) delete process.env[key];
after(() => { global.fetch = realFetch; process.env = env; Module._resolveFilename = resolve; });
const { exploreSchemeCatalog } = require('../src/lib/schemeCatalog.ts');
const { documentChatContext } = require('../src/lib/documentChatContext.ts');
const { explainDocument } = require('../src/lib/documentChat.ts');
const { cleanSpokenText, localVoiceBriefing } = require('../src/lib/speechText.ts');
const { createVoiceBriefing } = require('../src/lib/voiceBriefing.ts');
const { speechChunks, pcmToWav, synthesizeVoice } = require('../src/lib/voiceAudio.ts');
const { sanitizeTextForSpeech, speakText, stopSpeaking } = require('../src/lib/speech.ts');

test('a cloud answer in the wrong language is repaired and follow-up chips use the selected language', async () => {
  const {generateIntelligentChatReply}=require('../src/lib/llmService.ts');
  process.env.GEMINI_API_KEY='test-key'; let calls=0;
  global.fetch=async (url,options)=> {
    calls++; const payload=JSON.parse(options.body);
    assert.match(payload.systemInstruction.parts[0].text,/MANDATORY RESPONSE LANGUAGE: te/);
    const text=calls===1 ? 'Plants use sunlight to convert water and carbon dioxide into sugars for growth. CHIPS: ["Tell me more"]'
      : 'మొక్కలు సూర్యకాంతిని ఉపయోగించి నీరు, కార్బన్ డయాక్సైడ్ నుంచి ఆహారం తయారు చేసుకుంటాయి. ఈ ప్రక్రియ వల్ల పంట పెరుగుదలకు శక్తి లభిస్తుంది. CHIPS: ["Tell me more"]';
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text}]}}]}));
  };
  try {
    const reply=await generateIntelligentChatReply({query:'How does photosynthesis help crops grow?',language:'te'});
    assert.equal(reply.aiStatus.state,'cloud'); assert.equal(calls,2); assert.match(reply.text,/మొక్కలు/);
    assert.ok(reply.chips.every(c=>/[\u0C00-\u0C7F]/.test(c)));
  } finally {delete process.env.GEMINI_API_KEY;global.fetch=realFetch;}
});
test('provider quota failures still answer the complete broad farmer question with a localized fallback', async () => {
  const {generateIntelligentChatReply}=require('../src/lib/llmService.ts');
  process.env.GEMINI_API_KEY='test-key';
  global.fetch=async()=>new Response('{}',{status:429});
  try {
    const reply=await generateIntelligentChatReply({query:'I am a marginal farmer from Andhra Pradesh with 2.5 acres of dry land growing groundnut. What central and state government schemes am I eligible for to get financial assistance and subsidized drip irrigation?',language:'te'});
    assert.equal(reply.aiStatus.state,'fallback'); assert.match(reply.aiStatus.reason,/usage limit/);
    assert.match(reply.text,/APMIP/);assert.match(reply.text,/పథకాలు|డ్రిప్/); assert.doesNotMatch(reply.text,/Which scheme do you mean/);
    assert.ok(reply.modelReport.runs.every(r=>r.status==='failed'));
  } finally {delete process.env.GEMINI_API_KEY;global.fetch=realFetch;}
});

test('long booklet summaries cover sections beyond the cover and keep original sources for specific follow-ups', async () => {
  const pages = Array.from({length:90}, (_,i) => `[Page ${i+1}]\n${i===0 ? 'TELANGANA SAMANVAY: A compilation of Central sector and State schemes. October 2015.' : `Section ${i+1}: Government welfare information`}\n${`This section explains public support and procedures for its stated beneficiaries. `.repeat(12)}\n${i===70 ? 'Special application channel: submit at the district horticulture office.\nRequired documents: Land passbook\nBank passbook' : ''}`);
  const source=pages.join('\n\n');
  const context={extractedTextSnippet:source,docType:'land_record'};
  const summary=await explainDocument({query:'Summarize this document in detail',language:'en',documentContext:context});
  assert.ok(summary.text.length>7000); assert.match(summary.text,/Page 90|Page 8[0-9]/); assert.match(summary.text,/2015/);
  assert.match(summary.text,/extractive overview/); assert.match(summary.aiStatus.reason,/No AI provider key/);
  const answer=await explainDocument({query:'What is the special application channel?',language:'en',documentContext:context,history:[{role:'user',content:'Summarize this document'},{role:'assistant',content:summary.text}]});
  assert.match(answer.text,/district horticulture office/);
});

test('procedure and proceeding follow-ups retain the selected scheme and switch to application intent', () => {
  const {buildConversationMemory,schemeQuestionIntent,isContextualFollowup}=require('../src/lib/conversationMemory.ts');
  const history=[{role:'user',content:'Tell me about Kisan Credit Card'},{role:'assistant',content:'Kisan Credit Card supports farming credit. Which step do you need?'}];
  for(const query of ['What is the procedure for this?','How do I proceed further?']) {
    assert.equal(schemeQuestionIntent(query),'apply'); assert.ok(isContextualFollowup(query));
    const memory=buildConversationMemory(history,query); assert.match(memory.topic.scheme,/Kisan Credit Card/i);
  }
});

test('a cloud document overview receives broadly distributed source sections and asks for a substantial explanation', async () => {
  process.env.GEMINI_API_KEY='test-key'; let captured;
  global.fetch=async (url,options)=> {
    captured=JSON.parse(options.body);
    return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({claims:[{text:'Government reference booklet',sourceId:'D1',quote:'Government reference booklet'}],suggestions:[],missingInformation:[],chips:[]})}]}}]}));
  };
  try {
    const source=Array.from({length:90},(_,i)=>`[Page ${i+1}]\n${i===0?'Government reference booklet':`Section ${i+1}`}\n${'Government schemes offer assistance under their listed conditions. '.repeat(20)}`).join('\n');
    const answer=await explainDocument({query:'Summarize this document',language:'en',documentContext:{extractedTextSnippet:source}});
    assert.equal(answer.aiStatus.state,'cloud');
    const prompt=captured.systemInstruction.parts[0].text;
    assert.match(prompt,/600–1000/); assert.match(prompt,/Page 90/); assert.match(prompt,/Page 40|Page 41/);
  } finally { delete process.env.GEMINI_API_KEY; global.fetch=realFetch; }
});

test('Explore exposes thousands of unique saved schemes without model vectors or fake matches', () => {
  const catalog = exploreSchemeCatalog();
  assert.ok(catalog.length > 4000);
  assert.equal(new Set(catalog.map(s => s.id)).size, catalog.length);
  assert.ok(catalog.some(s => /KISAN/i.test(s.name)));
  assert.ok(catalog.some(s => /scholarship/i.test(s.name)));
  assert.ok(catalog.some(s => s.jurisdiction && !s.jurisdiction.startsWith('Central')));
  assert.ok(catalog.every(s => s.matchScore === 0 && !('vector' in s) && Array.isArray(s.documentsRequired)));
  assert.ok(catalog.every(s => !/<[^>]+>/.test(s.description + s.benefits)));
  assert.ok(new Set(catalog.map(s => s.categoryName)).size < 25, 'combined source tags must not produce hundreds of filter chips');
  const pmjay = catalog.find(s => /Pradhan Mantri Jan Arogya/.test(s.name));
  assert.match(pmjay.benefits, /5,00,000/);
  assert.doesNotMatch(pmjay.benefits, /5,000,000/);
});

test('Documents questions forward the full source but omit image previews and confirmation flags', () => {
  const input = { docType: 'land_record', parsedDetails: { fullOcrText: 'Government notice\nApplicant: Lakshmi' }, previewUrl: 'private-image-bytes', verified: true, profile: {name: 'injected'} };
  const context = documentChatContext(input);
  assert.match(context.extractedTextSnippet, /Lakshmi/);
  assert.doesNotMatch(JSON.stringify(context), /private-image|verified|injected/);
});

test('the Documents flow answers specific source questions even when no provider connects', async () => {
  const reply = await explainDocument({ query: 'Who is the applicant?', language: 'en', documentContext: {extractedTextSnippet: 'Government Farmer Scheme\nApplicant: Lakshmi\nRequired documents:\nIncome certificate'} });
  assert.match(reply.text, /Lakshmi/);
  assert.equal(reply.usedDocument, true);
  assert.equal(reply.aiStatus.state, 'fallback');
});

test('Documents summaries actually go through grounded cloud reasoning', async () => {
  global.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    const passages = JSON.parse(payload.systemInstruction.parts[0].text.split('SOURCE PASSAGES:\n')[1]);
    const source = passages.find(p => p.text.includes('Required documents: Income certificate'));
    return Response.json({candidates: [{content: {parts: [{text: JSON.stringify({claims: [{text: 'Prepare an income certificate.', sourceId: source.id, quote: 'Required documents: Income certificate'}], suggestions: [], missingInformation: [], chips: []})}]}}]});
  };
  try {
    const reply = await explainDocument({ query: 'What documents are required?', language: 'en', customApiKey: 'AQ.synthetic-document', documentContext: {extractedTextSnippet: 'Government Farmer Scheme\nRequired documents: Income certificate'} });
    assert.equal(reply.aiStatus.state, 'cloud');
    assert.match(reply.text, /income certificate/);
  } finally { global.fetch = realFetch; }
});

test('speech preserves decimal amounts and parenthesized eligibility conditions, omitting links and evidence', () => {
  const text = '**Benefit**\nAssistance is ₹2.5 lakh (not available to excluded applicants). [D1]\n[Official portal](https://example.gov.in/)\n\n---\n[D1] private source excerpt';
  for (const clean of [cleanSpokenText(text), sanitizeTextForSpeech(text)]) {
    assert.match(clean, /2\.5 lakh/);
    assert.match(clean, /not available to excluded applicants/);
    assert.doesNotMatch(clean, /https|D1|private source excerpt|\*\*/);
  }
});

test('offline briefings keep important uncertainty instead of reading all source excerpts', () => {
  const result = localVoiceBriefing('**Document summary**\nMachinery assistance is described.\nAsk the agriculture office about the next step.\nThe deadline is not verified.\n\n---\n[D1] Long source quotation');
  assert.match(result, /Machinery assistance/);
  assert.match(result, /deadline is not verified/);
  assert.doesNotMatch(result, /Long source|Document summary/);
});

test('voice briefing fallback works without a cloud key', async () => {
  const result = await createVoiceBriefing('The document describes machinery support. Confirm the current deadline with the agriculture office.', 'en');
  assert.match(result.text, /machinery support/);
  assert.doesNotMatch(result.text, /Document summary|Suggested next steps/);
});

test('speech chunks cover the entire briefing and respect upstream size limits', () => {
  const text = Array.from({length: 90}, (_,i) => `Item${i} means a useful next action.`).join(' ');
  const chunks = speechChunks(text);
  assert.ok(chunks.length > 4);
  assert.ok(chunks.every(c => c.length <= 150));
  assert.equal(chunks.join(' '), text);
  assert.ok(speechChunks('x'.repeat(450)).every(c => c.length <= 150));
});

test('native Gemini voice receives the exact transcript and returns playable WAV audio', async () => {
  const pcm = Buffer.alloc(240, 1);
  global.fetch = async (url, options) => {
    const payload = JSON.parse(options.body);
    assert.match(url, /flash-tts/);
    assert.equal(payload.contents[0].parts[0].text, 'Prepare an income certificate.');
    assert.equal(payload.generationConfig.speechConfig.languageCode, 'te-IN');
    assert.match(payload.contents[0].parts[0].speech_metadata.style, /conversational/);
    return Response.json({candidates:[{content:{parts:[{inlineData:{mimeType:'audio/L16;codec=pcm;rate=24000',data:pcm.toString('base64')}}]}}]});
  };
  try {
    const result = await synthesizeVoice('Prepare an income certificate.', 'te', 'AQ.synthetic-voice');
    assert.equal(result.provider, 'gemini');
    assert.equal(result.mime, 'audio/wav');
    assert.equal(result.bytes.toString('ascii',0,4), 'RIFF');
    assert.equal(result.bytes.readUInt32LE(24), 24000);
    assert.deepEqual(result.bytes.subarray(44), pcm);
  } finally { global.fetch = realFetch; }
});

test('speech fallback sends every chunk and does not silently stop after four', async () => {
  const spoken = [];
  global.fetch = async url => { spoken.push(new URL(url).searchParams.get('q')); return new Response(Buffer.from('audio')); };
  try {
    const text = 'Useful farmer guidance. '.repeat(35) + 'Final application step.';
    const result = await synthesizeVoice(text, 'en');
    assert.equal(result.provider, 'speech_fallback');
    assert.ok(spoken.length > 4);
    assert.match(spoken.join(' '), /Final application step/);
  } finally { global.fetch = realFetch; }
});

test('stopping speech while audio is loading prevents delayed playback', async () => {
  const savedWindow = global.window;
  const savedStorage = global.localStorage;
  const savedAudio = global.Audio;
  global.window = {};
  global.localStorage = {getItem: () => null};
  let finish;
  let played = false;
  global.fetch = () => new Promise(resolve => { finish = resolve; });
  global.Audio = class { constructor() { played = true; } };
  try {
    speakText('A short briefing.', 'en');
    stopSpeaking();
    finish(new Response(Buffer.from('audio'), {headers:{'content-type':'audio/mpeg'}}));
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(played, false);
  } finally { global.fetch = realFetch; global.window = savedWindow; global.localStorage = savedStorage; global.Audio = savedAudio; }
});

test('a full KCC guide includes an overview and several requested sections, not only a deadline', async () => {
  const {generateIntelligentChatReply} = require('../src/lib/llmService.ts');
  const reply = await generateIntelligentChatReply({query:'Guide me through Kisan Credit Card. Explain current eligibility, required documents, application steps and any verified deadline for my profile.',language:'en'});
  assert.match(reply.text, /credit facility|bank credit|credit terms|credit for farming/i);
  for (const section of ['Eligibility:', 'Documents:', 'Application:', 'Deadline:']) assert.ok(reply.text.includes(section));
});

test('asking what a scheme is resets a previous application intent', () => {
  const {buildConversationMemory,finishConversationMemory} = require('../src/lib/conversationMemory.ts');
  const {farmerChatReply} = require('../src/lib/farmerChat.ts');
  let memory=buildConversationMemory([], 'How do I apply for Kisan Credit Card?');
  memory=finishConversationMemory(memory,'Ask your bank for the current form.');
  memory=buildConversationMemory([], 'what is that scheme tell me about that',memory);
  assert.equal(memory.topic.intent,'overview');
  const reply=farmerChatReply('what is that scheme tell me about that','en',null,[],memory);
  assert.match(reply.text,/credit facility|credit terms|credit for farming/i);
  assert.doesNotMatch(reply.text,/^To apply/i);
});

test('full guides reach a configured model when current official retrieval is disabled', async () => {
  const {generateIntelligentChatReply}=require('../src/lib/llmService.ts');
  const previous=process.env.JANMITRA_FETCH_OFFICIAL_SOURCES;
  process.env.JANMITRA_FETCH_OFFICIAL_SOURCES='0';
  global.fetch=async (_url,options)=>{
    const payload=JSON.parse(options.body);
    const passages=JSON.parse(payload.systemInstruction.parts[0].text.split('SOURCE PASSAGES:\n')[1]);
    const source=passages[0], quote=source.text.split('\n').find(line=>line.startsWith('Description:'));
    return Response.json({usageMetadata:{promptTokenCount:100,candidatesTokenCount:40},candidates:[{content:{parts:[{text:JSON.stringify({claims:[{text:quote,sourceId:source.id,quote}],suggestions:[],missingInformation:['Current eligibility and dates require official verification.'],chips:[]})}]}}]});
  };
  try {
    const reply=await generateIntelligentChatReply({query:'Guide me through Kisan Credit Card. Explain eligibility, required documents, application steps and any verified deadline.',language:'en',customApiKey:'AQ.synthetic-guide'});
    assert.equal(reply.provider,'gemini');
    assert.ok(reply.modelReport.runs.some(r=>r.model==='gemini-3.8-flash'&&r.inputTokens===100));
    assert.doesNotMatch(JSON.stringify(reply.modelReport),/synthetic-guide/);
  } finally {global.fetch=realFetch;if(previous==null)delete process.env.JANMITRA_FETCH_OFFICIAL_SOURCES;else process.env.JANMITRA_FETCH_OFFICIAL_SOURCES=previous;}
});

test('model traces remain isolated across concurrent requests', async () => {
  const {captureModels,modelFetch}=require('../src/lib/modelTelemetry.ts');
  global.fetch=async()=>Response.json({usage:{prompt_tokens:3,completion_tokens:2}});
  try {
    const results=await Promise.all(['model-a','model-b'].map(model=>captureModels(()=>modelFetch('https://api.example.test/v1/chat',{method:'POST',body:JSON.stringify({model})}))));
    assert.deepEqual(results.map(r=>r.modelReport.runs.map(x=>x.model)),[['model-a'],['model-b']]);
  } finally {global.fetch=realFetch;}
});

test('expanded farmer examples are labeled and have demo phone numbers', () => {
  const {peerDirectory}=require('../src/lib/peerDirectory.ts');
  const peers=peerDirectory();
  assert.equal(peers.length,32);
  assert.ok(peers.every(p=>p.isDemo&&p.contactAllowed&&p.contactPhone));
  const seed=require('../src/lib/mockData.ts').NEARBY_PEERS[0];
  assert.equal(peerDirectory([{id:'migrated-seed',farmer_name:seed.farmerName,village:seed.village,contact_allowed:true,contact_phone:'do-not-publish'}]).length,32);
  assert.ok(peerDirectory([{id:'registered-test',farmer_name:'Consented record',distance_km:2,contact_allowed:false,contact_phone:'must-not-leak'}]).some(p=>p.id==='registered-test'&&!p.contactPhone));
});

test('document XAI exposes measured retrieval ablations and source passages', () => {
  const {explainRetrieval}=require('../src/lib/explainability.ts');
  const result=explainRetrieval('cotton machinery documents','[Page 1]\nCotton machinery support\nRequired documents: Machinery quotation\n[Page 2]\nSchool meal programme.');
  assert.ok(result.contributions.some(c=>c.term==='cotton'&&Number.isFinite(c.scoreDrop)));
  assert.ok(result.passages.some(p=>/Machinery quotation/.test(p.text)));
  assert.match(result.limitation,/not a causal/);
});

test('actual CLIP occlusion explanation reruns the model for all four quadrants', {skip:!process.env.TEST_XAI_IMAGE}, async () => {
  const {captureModels}=require('../src/lib/modelTelemetry.ts');
  const {explainImageOcclusion}=require('../src/lib/localImageModel.ts');
  const {result,modelReport}=await captureModels(()=>explainImageOcclusion(fs.readFileSync(process.env.TEST_XAI_IMAGE)));
  assert.equal(result.regions.length,4);
  assert.ok(result.regions.every(r=>Number.isFinite(r.scoreDrop)));
  assert.equal(modelReport.runs.filter(r=>r.model==='CLIP ViT-B/32 q8').length,5);
  assert.match(result.limitation,/does not identify disease/);
});

test('an empty gateway response is an analysis error, never an irrelevant-image result', async () => {
  const {useFarmerStore}=require('../src/store/useFarmerStore.ts');
  global.fetch=async()=>new Response('',{status:502});
  try {
    const success=await useFarmerStore.getState().analyzeUploadedFile('data:image/png;base64,aGVsbG8=','test.png','image/png');
    assert.equal(success,false);
    const error=useFarmerStore.getState().outOfScopeError;
    assert.equal(error.title,'Analysis Error');
    assert.match(error.reason,/incomplete response/i);
    assert.doesNotMatch(error.message,/not.*related|irrelevant image/i);
  } finally {global.fetch=realFetch;}
});

test('SSY full-guide questions retain the scheme explanation as well as paperwork and process', async () => {
  const {generateIntelligentChatReply}=require('../src/lib/llmService.ts');
  const reply=await generateIntelligentChatReply({query:'Guide me through Sukanya Samriddhi Yojana (SSY). Explain current eligibility, required documents, application steps and any verified deadline for my profile.',language:'en'});
  assert.match(reply.text,/Sukanya|girl child/i);
  assert.match(reply.text,/Eligibility:/);
  assert.match(reply.text,/How to apply:/);
  assert.match(reply.text,/Documents:/);
});

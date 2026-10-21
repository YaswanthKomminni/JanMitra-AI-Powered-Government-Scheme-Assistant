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

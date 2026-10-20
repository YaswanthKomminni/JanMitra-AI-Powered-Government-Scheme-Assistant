const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
const { semanticSearchSchemes } = require('../src/lib/aiCopilotService.ts');
const { GUEST_FARMER } = require('../src/lib/mockData.ts');
const { farmerChatReply, schemeReferences } = require('../src/lib/farmerChat.ts');
const { buildConversationMemory, finishConversationMemory } = require('../src/lib/conversationMemory.ts');
const { generateIntelligentChatReply } = require('../src/lib/llmService.ts');
const env = { ...process.env };
const originalFetch = global.fetch;
for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'VISION_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY']) delete process.env[key];
after(() => { process.env = env; global.fetch = originalFetch; Module._resolveFilename = originalResolve; });

test('catalog search never treats a vector collision or unknown state as applicability', () => {
  assert.deepEqual(semanticSearchSchemes('helloo', GUEST_FARMER), []);
  assert.deepEqual(semanticSearchSchemes('which government schemes can I apply for', GUEST_FARMER), []);
  const generic = semanticSearchSchemes('chaff cutter', GUEST_FARMER, 20);
  assert.ok(generic.every(match => !match.jurisdiction));
  const telangana = semanticSearchSchemes('chaff cutter', { ...GUEST_FARMER, state: 'Telangana' }, 20);
  assert.ok(telangana.every(match => !match.jurisdiction || match.jurisdiction === 'Telangana'));
  const gujarat = semanticSearchSchemes('power driven chaff cutter Gujarat', GUEST_FARMER, 10);
  assert.ok(gujarat.some(match => match.jurisdiction === 'Gujarat'));
  assert.ok(gujarat.every(match => match.eligibility === undefined));
});

test('chat location corrections override saved state for catalog recommendations', () => {
  const profile = { ...GUEST_FARMER, state: 'Telangana' };
  const query = 'power driven chaff cutter subsidy';
  assert.ok(schemeReferences(query, profile).every(item => item.jurisdiction !== 'Gujarat'));
  const memory = { version: 1, facts: { state: 'Gujarat' } };
  assert.ok(schemeReferences(query, profile, memory).some(item => item.jurisdiction === 'Gujarat'));
});

test('an exact scheme acronym cannot be replaced by another scheme sharing a common word', () => {
  for (const [query, expected] of [['PM-KISAN', /Kisan Samman Nidhi/i], ['KCC', /Kisan Credit Card/i], ['PMFBY', /Fasal Bima/i], ['PM-KUSUM', /KUSUM|Urja Suraksha/i]]) {
    const matches = semanticSearchSchemes(query, GUEST_FARMER, 3);
    assert.ok(matches.length, query);
    assert.match(matches[0].scheme.name, expected);
    assert.ok(matches.every(item => expected.test(item.scheme.name)), query);
  }
});

test('greetings and unrelated questions bypass cloud providers even with an old upload', async () => {
  process.env.GROQ_API_KEY = 'gsk_synthetic-test';
  global.fetch = async () => { throw new Error('A greeting or off-topic turn must not call a provider'); };
  try {
    const history = [{ role: 'user', content: 'What is PM-KISAN?' }];
    for (const query of ['helloo', 'Tell me a joke', 'What is the capital of India?']) {
      const reply = await generateIntelligentChatReply({ query, language: 'en', history, documentContext: { title: 'Old document' } });
      assert.equal(reply.provider, 'campusone_copilot');
      assert.equal(reply.usedDocument, false);
      assert.doesNotMatch(reply.text, /Gujarat|chaff cutter|PM-KISAN/);
    }
  } finally { delete process.env.GROQ_API_KEY; global.fetch = originalFetch; }
});

test('deadline follow-up replaces a previous document-checklist intent without inventing a date', () => {
  let memory = buildConversationMemory([], 'What documents are needed for PM-KISAN?');
  memory = finishConversationMemory(memory, 'Check the official checklist. Which state are you in?');
  memory = buildConversationMemory([], 'What is the deadline?', memory);
  const reply = farmerChatReply('What is the deadline?', 'en', null, [], memory);
  assert.equal(memory.topic.intent, 'deadline');
  assert.match(reply.text, /cannot confirm a current application deadline/i);
  assert.doesNotMatch(reply.text, /\d{1,2}[/.\-]\d{1,2}/);
});

test('scheme recommendations and named application guidance respect selected language', () => {
  const profile = { ...GUEST_FARMER, state: 'Telangana', primaryCrops: ['cotton'], landSizeAcres: 3 };
  const broad = farmerChatReply('Which schemes fit me?', 'te', profile);
  assert.match(broad.text, /Telangana|cotton/);
  assert.match(broad.text, /అవకాశాలు మాత్రమే/);
  assert.doesNotMatch(broad.text, /Gujarat|60%|4%|definitely eligible/);
  const apply = farmerChatReply('How to apply for PM-KISAN?', 'hi', profile);
  assert.match(apply.text, /आधिकारिक लिंक/);
  assert.doesNotMatch(apply.text, /To apply|prepare identity/);
});

test('a farmer can choose a suggested support type and continue to its application guide', () => {
  let memory = buildConversationMemory([], 'Which schemes fit me?');
  const recommended = farmerChatReply('Which schemes fit me?', 'en', null, [], memory);
  memory = finishConversationMemory(memory, recommended.text);
  memory = buildConversationMemory([], 'insurance', memory);
  assert.equal(memory.topic.scheme, 'PMFBY');
  memory = buildConversationMemory([], 'How do I apply?', memory);
  const reply = farmerChatReply('How do I apply?', 'en', null, [], memory);
  assert.match(reply.text, /To apply for PMFBY/);
  assert.doesNotMatch(reply.text, /chaff cutter|Gujarat/);
});

test('an unverified catalog deadline cannot be supplied by a cloud model', async () => {
  process.env.GROQ_API_KEY = 'gsk_synthetic-test';
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('No current official deadline evidence'); };
  try {
    const reply = await generateIntelligentChatReply({ query: 'What is the deadline for the chaff cutter scheme in Gujarat?', language: 'en' });
    assert.equal(calls, 0);
    assert.match(reply.text, /cannot confirm a current application deadline/i);
    assert.equal(reply.provider, 'campusone_copilot');
  } finally { delete process.env.GROQ_API_KEY; global.fetch = originalFetch; }
});

test('catalog-based cloud answers require supporting quotes and reject invented deadlines', async () => {
  process.env.GROQ_API_KEY = 'gsk_synthetic-test';
  let payload;
  global.fetch = async (_url, options) => {
    payload = JSON.parse(options.body);
    const system = payload.messages[0].content;
    const passages = JSON.parse(system.split('SOURCE PASSAGES:\n')[1]);
    const quote = passages[0].text.split('\n').find(line => line.startsWith('Scheme:'));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ claims: [{ text: quote, sourceId: passages[0].id, quote }], suggestions: [], missingInformation: [], chips: [] }) } }] });
  };
  try {
    const request = { query: 'Tell me about the power driven chaff cutter scheme in Gujarat', language: 'en' };
    const reply = await generateIntelligentChatReply(request);
    assert.equal(reply.provider, 'groq');
    assert.equal(payload.response_format.type, 'json_object');
    assert.match(payload.messages[0].content, /NOT current policy/);
    global.fetch = async () => Response.json({ choices: [{ message: { content: 'You are eligible. Apply by 30/12/2099.' } }] });
    const rejected = await generateIntelligentChatReply(request);
    assert.equal(rejected.provider, 'campusone_copilot');
    assert.doesNotMatch(rejected.text, /2099|You are eligible/);
  } finally { delete process.env.GROQ_API_KEY; global.fetch = originalFetch; }
});

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
const { answerDocumentQuestion } = require('../src/lib/nlpDocumentAnalyzer.ts');
const { partialDocumentSource } = require('../src/lib/partialDocument.ts');
const { generateIntelligentChatReply } = require('../src/lib/llmService.ts');
const { buildConversationMemory, finishConversationMemory } = require('../src/lib/conversationMemory.ts');
const { imageReadingViews } = require('../src/lib/visionLlm.ts');
const env = { ...process.env };
const realFetch = global.fetch;
for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'VISION_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY']) delete process.env[key];
after(() => { process.env = env; global.fetch = realFetch; Module._resolveFilename = originalResolve; });
const poster = { analysisQuality: 'partial', docType: 'land_record', extractedTextSnippet: 'xx ## lll\nTELANGANA GOVT SCHEMES AND POLICIES\nMahalakshmi\nRythu Bharosa\nRs 99999 illegible amount', detectionSummary: 'I can see a printed document/table. Its fine print is too small.', extractedData: { Amount: '99999' } };

test('partial poster summary describes readable content instead of repeating an unreadable warning', () => {
  const answer = answerDocumentQuestion('Tell me about the image', poster, 'en');
  assert.match(answer.text, /TELANGANA GOVT SCHEMES AND POLICIES/);
  assert.match(answer.text, /Mahalakshmi/);
  assert.match(answer.text, /Rythu Bharosa/);
  assert.doesNotMatch(answer.text, /99999/);
  assert.match(answerDocumentQuestion('How much money is listed?', poster, 'en').text, /Not specified/);
});

test('partial document evidence survives a summary and specific chat follow-ups', async () => {
  let memory = buildConversationMemory([], 'Tell me about this image', undefined, true);
  memory.latestUploadAvailable = true;
  const first = await generateIntelligentChatReply({ query: 'Tell me about this image', language: 'en', documentContext: poster, forceDocumentContext: true, conversationMemory: memory });
  memory = finishConversationMemory(memory, first.text);
  memory = buildConversationMemory([], 'Which schemes are mentioned?', memory);
  const followup = await generateIntelligentChatReply({ query: 'Which schemes are mentioned?', language: 'en', documentContext: poster, conversationMemory: memory });
  assert.equal(followup.usedDocument, true);
  assert.match(followup.text, /Mahalakshmi/);
  assert.match(followup.text, /Rythu Bharosa/);
  assert.doesNotMatch(followup.text, /I can see a printed document\/table/);
});

test('confirmed regions of an incomplete page answer exact questions without trusting noisy fields', () => {
  const document = { ...poster, readablePassages: [{ text: 'Government Pension Scheme\nApplicant: Meena Devi', confidence: 92 }, { text: 'Amount: 99999', confidence: 25 }] };
  assert.match(answerDocumentQuestion('Who is the applicant?', document, 'en').text, /Meena Devi/);
  assert.doesNotMatch(partialDocumentSource(document), /99999/);
});

test('real OCR pipeline keeps readable lines when the rest of the page has low confidence', async () => {
  const tesseract = require('tesseract.js');
  const original = tesseract.createWorker;
  let calls = 0;
  tesseract.createWorker = async () => ({ reinitialize: async () => {}, setParameters: async () => {}, terminate: async () => {},
    recognize: async (_image, _options, output) => {
      assert.equal(output.blocks, true);
      calls++;
      return { data: { text: 'Government Pension Scheme\nApplicant: Meena Devi\nAmount: 99999', confidence: 40,
        blocks: [{ paragraphs: [{ lines: [
          { text: 'Applicant: Meena Devi', confidence: 95, words: [{ text: 'Applicant:', confidence: 96 }, { text: 'Meena', confidence: 96 }, { text: 'Devi', confidence: 96 }] },
          { text: 'Amount: 99999', confidence: 88, words: [{ text: 'Amount:', confidence: 95 }, { text: '99999', confidence: 25 }] },
        ] }] }] } };
    } });
  try {
    const image = await require('sharp')({ create: { width: 20, height: 20, channels: 3, background: '#fff' } }).png().toBuffer();
    const { analyzeDocumentComprehensive } = require('../src/lib/ocrEngine.ts');
    const result = await analyzeDocumentComprehensive('data:image/png;base64,' + image.toString('base64'));
    assert.ok(calls >= 1);
    assert.equal(result.analysisQuality, 'partial');
    assert.match(answerDocumentQuestion('Who is the applicant?', result, 'en').text, /Meena Devi/);
    assert.doesNotMatch(partialDocumentSource(result), /99999/);
  } finally { tesseract.createWorker = original; }
});

test('application follow-up can explain a readable scheme using clearly separated general knowledge', async () => {
  const document = { analysisQuality: 'partial', extractedTextSnippet: 'Government Welfare Scheme\nPM-KISAN', docType: 'land_record' };
  let memory = buildConversationMemory([], 'Summarize this document', undefined, true);
  memory.latestUploadAvailable = true;
  memory = buildConversationMemory([], 'How to apply?', memory);
  const reply = await generateIntelligentChatReply({ query: 'How to apply?', language: 'en', documentContext: document, conversationMemory: memory });
  assert.match(reply.text, /PM-KISAN/);
  assert.match(reply.text, /General scheme guidance/);
  assert.match(reply.text, /To apply/);
  assert.equal(reply.usedDocument, true);
});

test('partial uploads with readable evidence can use grounded cloud question answering', async () => {
  process.env.GROQ_API_KEY = 'gsk_synthetic-test';
  let called = false;
  global.fetch = async (_url, options) => {
    called = true;
    const payload = JSON.parse(options.body);
    assert.match(payload.messages[0].content, /only partly readable/);
    assert.doesNotMatch(payload.messages[0].content, /99999/);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ claims: [{ text: 'The poster mentions Rythu Bharosa.', sourceId: 'D1', quote: 'Rythu Bharosa' }], suggestions: [], missingInformation: [], chips: [] }) } }] });
  };
  try {
    const reply = await generateIntelligentChatReply({ query: 'Which schemes are mentioned?', language: 'en', documentContext: poster, forceDocumentContext: true });
    assert.ok(called);
    assert.equal(reply.provider, 'groq');
    assert.match(reply.text, /Rythu Bharosa/);
  } finally { delete process.env.GROQ_API_KEY; global.fetch = realFetch; }
});

test('vision reading retains the original and supplies overlapping detail views', async () => {
  const png = await require('sharp')({ create: { width: 700, height: 1200, channels: 3, background: '#fff' } }).png().toBuffer();
  const original = 'data:image/png;base64,' + png.toString('base64');
  const views = await imageReadingViews(original, 'image/png');
  assert.equal(views[0].url, original);
  assert.equal(views.length, 4);
  const details = await require('sharp')(Buffer.from(views[1].url.split(',')[1], 'base64')).metadata();
  assert.ok(details.height < 1200 && details.width === 700);
});

 test('hai after a partial upload greets the farmer without replaying the document', async () => {
  for (const query of ['hai', 'Hai!', 'hii', 'helloo']) {
    let memory = buildConversationMemory([], 'Summarize this document', undefined, true);
    memory.latestUploadAvailable = true;
    memory = buildConversationMemory([], query, memory);
    const reply = await generateIntelligentChatReply({ query, language: 'en', documentContext: poster, conversationMemory: memory });
    assert.equal(reply.usedDocument, false);
    assert.match(reply.text, /Hello/);
    assert.doesNotMatch(reply.text, /Document summary|printed document|Mahalakshmi/);
  }
});

test('Gemini request uses current parameters and retries another model after quota rejection', async () => {
  process.env.GEMINI_API_KEY = 'synthetic-test-only';
  let posts = 0;
  global.fetch = async (url, options) => {
    if (!options.body) return Response.json({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }] });
    posts++;
    const payload = JSON.parse(options.body);
    assert.equal(payload.generationConfig.temperature, undefined);
    assert.deepEqual(payload.generationConfig.thinkingConfig, { thinkingLevel: 'low' });
    if (posts === 1) return new Response('', { status: 429 });
    return Response.json({ candidates: [{ content: { parts: [{ thought: true, text: 'private reasoning' }, { text: 'Check the soil moisture before watering.\nCHIPS: Soil type|Crop age' }] } }] });
  };
  try {
    const reply = await generateIntelligentChatReply({ query: 'How should I check soil moisture?', language: 'en' });
    assert.equal(posts, 2);
    assert.equal(reply.provider, 'gemini');
    assert.match(reply.text, /soil moisture/);
    assert.doesNotMatch(reply.text, /private reasoning/);
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('model discovery includes account available older and preview multimodal models', async () => {
  const { discoverProviderModels } = require('../src/lib/aiProviders.ts');
  global.fetch = async () => Response.json({ models: ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-3.8-flash-tts', 'gemini-3.1-flash-image'].map(id => ({ name: 'models/' + id, supportedGenerationMethods: ['generateContent'] })) });
  try {
    const models = await discoverProviderModels('gemini', 'synthetic-test-only', true, AbortSignal.timeout(1000));
    assert.deepEqual(models, ['gemini-2.5-flash', 'gemini-3-flash-preview']);
  } finally { global.fetch = realFetch; }
});

test('bad local OCR cannot override a readable cloud document', () => {
  const { reconcileImageEvidence } = require('../src/lib/imageEvidence.ts');
  const cloud = { scopeStatus: 'in_scope', isAgriRelated: true, docType: 'land_record', confidenceScore: .9,
    extractedTextSnippet: 'Government Pension Scheme\nApplicant: Meena Devi\nMonthly assistance: Rs 2000', detectionSummary: 'Pension assistance for Meena Devi.', suggestions: [], visionStatus: { state: 'cloud', provider: 'gemini', model: 'test' } };
  const local = { ...cloud, analysisQuality: 'partial', visionStatus: undefined, extractedTextSnippet: 'Govt Scheme\nApplicant: Xqrrn\nMonthly assistance: Rs 99999', readablePassages: [] };
  const result = reconcileImageEvidence(cloud, local);
  assert.equal(result.analysisQuality, 'complete');
  assert.match(result.extractedTextSnippet, /Meena Devi/);
  assert.doesNotMatch(result.extractedTextSnippet, /99999/);
  assert.equal(result.visionStatus.state, 'cloud');
});

test('provider errors show a connection problem without secrets or blaming the upload', () => {
  const { visionStatusMessage } = require('../src/lib/visionStatus.ts');
  assert.match(visionStatusMessage({ state: 'local', failures: [{ provider: 'gemini', code: 'quota' }] }, 'en'), /usage limit/);
  assert.match(visionStatusMessage({ state: 'local', failures: [{ provider: 'gemini', code: 'auth' }] }, 'en'), /connection was rejected/);
  assert.match(visionStatusMessage({ state: 'local', failures: [] }, 'te'), /AI/);
  assert.equal(visionStatusMessage({ state: 'cloud', provider: 'gemini' }, 'en'), '');
});

test('Gemini reads uploaded image and PDF bytes; saved evidence answers a follow-up', async () => {
  const ocr = require('../src/lib/ocrEngine.ts');
  const original = ocr.analyzeDocumentComprehensive;
  const { analyzeImageIntelligently } = require('../src/lib/visionLlm.ts');
  const source = 'Telangana Government Welfare Scheme\nMahalakshmi\nRequired documents: Income certificate and Aadhaar\nApplication deadline: 30.11.2026';
  ocr.analyzeDocumentComprehensive = async () => ({ scopeStatus: 'uncertain', isAgriRelated: false, confidenceScore: 0, extractedTextSnippet: '', suggestions: [] });
  process.env.GEMINI_API_KEY = 'synthetic-test-only';
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    const payload = JSON.parse(options.body);
    assert.ok(payload.contents[0].parts.some(p => p.inlineData?.data));
    assert.equal(payload.generationConfig.temperature, undefined);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'in_scope', isAgriRelated: true, title: 'Mahalakshmi notice', docType: 'identity_card', confidenceScore: .9,
      detectionSummary: 'A Telangana Mahalakshmi application notice.', extractedTextSnippet: source, extractedData: {}, suggestions: [] }) }] } }] });
  };
  try {
    const png = await require('sharp')({ create: { width: 40, height: 40, channels: 3, background: '#fff' } }).png().toBuffer();
    for (const [mime, bytes] of [['image/png', png], ['application/pdf', Buffer.from('synthetic PDF request fixture')]]) {
      const result = await analyzeImageIntelligently({ fileBase64: `data:${mime};base64,${bytes.toString('base64')}`, language: 'en' });
      assert.equal(result.visionStatus.state, 'cloud');
      assert.equal(result.analysisQuality, 'complete');
      assert.match(answerDocumentQuestion('What documents are required?', result, 'en').text, /Income certificate|Aadhaar/);
      assert.match(answerDocumentQuestion('When is the deadline?', result, 'en').text, /30\.11\.2026/);
    }
    assert.equal(calls, 2);
  } finally { ocr.analyzeDocumentComprehensive = original; delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('an unrelated room photo is rejected by visual evidence rather than accepted as a government document', async () => {
  const ocr = require('../src/lib/ocrEngine.ts');
  const original = ocr.analyzeDocumentComprehensive;
  const { analyzeImageIntelligently } = require('../src/lib/visionLlm.ts');
  ocr.analyzeDocumentComprehensive = async () => ({ scopeStatus: 'uncertain', isAgriRelated: false, confidenceScore: 0, suggestions: [] });
  process.env.GEMINI_API_KEY = 'synthetic-test-only';
  global.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'out_of_scope', confidenceScore: .98, detectionSummary: 'A room ceiling and fan; no crop or welfare document is visible.', suggestions: [] }) }] } }] });
  try {
    const result = await analyzeImageIntelligently({ fileBase64: 'data:image/jpeg;base64,c3ludGhldGlj' });
    assert.equal(result.scopeStatus, 'out_of_scope');
    assert.equal(result.isAgriRelated, false);
  } finally { ocr.analyzeDocumentComprehensive = original; delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

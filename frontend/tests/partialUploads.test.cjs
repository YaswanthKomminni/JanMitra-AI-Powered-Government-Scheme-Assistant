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

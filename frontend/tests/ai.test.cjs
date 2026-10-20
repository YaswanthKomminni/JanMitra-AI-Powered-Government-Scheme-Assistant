const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Run the production TypeScript modules with the same @/ alias, without a server or API keys.
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { assessUploadText } = require('../src/lib/uploadScope.ts');
const { parseAndSummarizeDocumentContent, answerDocumentQuestion } = require('../src/lib/nlpDocumentAnalyzer.ts');
const { analyzeImageIntelligently, normalizeVisionResult } = require('../src/lib/visionLlm.ts');
const { performOcr } = require('../src/lib/ocrEngine.ts');
const { generateIntelligentChatReply } = require('../src/lib/llmService.ts');
const { classifyImagePixels } = require('../src/lib/visionClassifier.ts');
const { classifyImageObjects, clearlyIrrelevantObject } = require('../src/lib/localImageModel.ts');
const env = { ...process.env };
const realFetch = global.fetch;
after(() => { process.env = env; global.fetch = realFetch; Module._resolveFilename = resolve; });
const upload = (text) => 'data:text/plain;base64,' + Buffer.from(text).toString('base64');
const notice = 'Government Welfare Department\nPension Scheme Application\nApplicant: Meena Devi\nLast date: 30.11.2026\nRequired documents:\n1. Income certificate\n2. Aadhaar card';

test('all welfare documents and multilingual notices are relevant; software-only screens are rejected', () => {
  for (const text of [notice, 'Birsa Agricultural University admission counselling for 2026', 'Directorate of Agriculture recruitment notice', 'ICAR DARE agricultural research foreword', 'ప్రభుత్వ పథకానికి దరఖాస్తు మరియు పత్రాలు', 'सरकारी पेंशन योजना आवेदन दस्तावेज']) assert.equal(assessUploadText(text), 'in_scope');
  assert.equal(assessUploadText('npm run build\nlocalhost\nSyntaxError failed'), 'out_of_scope');
  assert.equal(assessUploadText(''), 'uncertain');
  assert.equal(assessUploadText('Government scholarship portal error: localhost npm run'), 'in_scope');
});

test('local parsing never substitutes sample dates or unrelated farmer schemes', () => {
  const parsed = parseAndSummarizeDocumentContent(notice, 'selfie.jpg');
  assert.match(parsed.summary, /30\.11\.2026/);
  assert.equal(parsed.extractedParameters['Owner / Applicant'], 'Meena Devi');
  assert.deepEqual(parsed.unlockedSchemes, []);
  assert.doesNotMatch(JSON.stringify(parsed), /2023-24|1,800|Ramesh|241\/A|Flonicamid|YOLO/);
  assert.doesNotMatch(parseAndSummarizeDocumentContent('').summary, /official registered|entitlement/);
});

test('short and specific questions take priority over summaries and document checklists', () => {
  const detection = { parsedDetails: parseAndSummarizeDocumentContent(notice) };
  assert.match(answerDocumentQuestion('Who is the applicant in this document?', detection, 'en').text, /Meena Devi/);
  assert.match(answerDocumentQuestion('Give me suggestions for this document', detection, 'en').text, /Suggested next steps/);
  assert.match(answerDocumentQuestion('How to apply?', detection, 'en').text, /next steps/);
  assert.match(answerDocumentQuestion('What documents are required?', detection, 'en').text, /Income certificate/);
  assert.match(answerDocumentQuestion('What is the survey number in this document?', detection, 'en').text, /Not specified/);
  assert.match(answerDocumentQuestion('When?', detection, 'en').text, /30\.11\.2026/);
});

test('cloud structured facts survive follow-ups, including owner names and summaries', () => {
  const detection = { title: 'Land record', detectionSummary: 'A land record for Arun.', extractedData: { ownerName: 'Arun', surveyNumber: '18/B' }, suggestions: ['Visit the issuing revenue office.'], schemesUnlocked: [] };
  assert.match(answerDocumentQuestion('Owner?', detection, 'en').text, /Arun/);
  assert.match(answerDocumentQuestion('Survey?', detection, 'en').text, /18\/B/);
  assert.match(answerDocumentQuestion('Summarize', detection, 'en').text, /A land record for Arun/);
  for (const lang of ['en', 'te', 'hi', 'ta', 'kn', 'bn']) assert.ok(answerDocumentQuestion('Summarize', detection, lang).text.length);
});

test('no keys: document text works offline and unreadable uploads stay uncertain', async () => {
  for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'VISION_API_KEY', 'GROQ_API_KEY', 'OPENAI_API_KEY']) delete process.env[key];
  const result = await analyzeImageIntelligently({ fileBase64: upload(notice), classification: { isAgriRelated: false, detectedType: 'crop_disease' } });
  assert.equal(result.scopeStatus, 'in_scope');
  assert.match(result.extractedTextSnippet, /Meena Devi/);
  const unreadable = await analyzeImageIntelligently({ fileBase64: upload(''), fileName: 'government_scheme.pdf' });
  assert.equal(unreadable.scopeStatus, 'uncertain');
  assert.equal(unreadable.confidenceScore, 0);
  const reply = await generateIntelligentChatReply({ query: 'Owner?', language: 'en', documentContext: result });
  assert.equal(reply.provider, 'campusone_copilot');
  assert.match(reply.text, /Meena Devi/);
});

test('OCR evidence overrides a false cloud portrait rejection', async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'out_of_scope', confidenceScore: 0.98, reason: 'portrait', suggestions: [] }) }] } }] });
  const result = await analyzeImageIntelligently({ fileBase64: upload(notice) });
  assert.equal(result.scopeStatus, 'in_scope');
  delete process.env.GEMINI_API_KEY;
});

test('failed provider moves to another configured provider, then grounded fallback', async () => {
  process.env.GEMINI_API_KEY = 'test-gemini'; process.env.GROQ_API_KEY = 'test-groq';
  const urls = [];
  global.fetch = async (url) => {
    urls.push(url);
    return url.includes('googleapis') ? new Response('', { status: 429 }) : Response.json({ choices: [{ message: { content: 'Grounded answer\nCHIPS: ["Next step?"]' } }] });
  };
  const reply = await generateIntelligentChatReply({ query: 'Summarize', language: 'en' });
  assert.equal(reply.provider, 'groq'); assert.equal(urls.length, 2);
  global.fetch = async () => new Response('', { status: 401 });
  const fallback = await generateIntelligentChatReply({ query: 'Who is the applicant?', language: 'en', documentContext: { parsedDetails: parseAndSummarizeDocumentContent(notice) } });
  assert.equal(fallback.provider, 'campusone_copilot'); assert.match(fallback.text, /Meena Devi/);
  delete process.env.GEMINI_API_KEY; delete process.env.GROQ_API_KEY; global.fetch = realFetch;
});

test('malformed model output is not silently accepted as a relevant document', () => {
  assert.equal(normalizeVisionResult({}), null);
  assert.equal(normalizeVisionResult({ scopeStatus: 'uncertain' }).isAgriRelated, false);
});

test('filenames, image colors and manually selected categories cannot verify an upload', () => {
  for (const category of ['auto_detect', 'crop_disease', 'land_record', 'identity_card']) {
    const result = classifyImagePixels([0, 255, 0, 255], 1, 1, 'government_scheme.pdf', category);
    assert.equal(result.scopeStatus, 'pending');
    assert.equal(result.isAgriRelated, false);
    assert.equal(result.confidence, 0);
  }
});

test('poster explanation includes its readable summary and suggested steps', () => {
  const detection = { parsedDetails: parseAndSummarizeDocumentContent('TELANGANA GOVT SCHEMES AND POLICIES\nMahalakshmi\nRythu Bharosa\nCheck eligibility with the issuing department.') };
  const reply = answerDocumentQuestion('tell me about this schemes', detection, 'en');
  assert.match(reply.text, /TELANGANA/);
  assert.match(reply.text, /Suggested next steps/);
  assert.match(reply.text, /Mahalakshmi/);
});

test('object rejection requires confident explicit unrelated evidence', () => {
  assert.ok(clearlyIrrelevantObject([{ label: 'an indoor room with a ceiling, walls, a fan and furniture', probability: 0.9 }]));
  assert.equal(clearlyIrrelevantObject([{ label: 'electric fan, blower', probability: 0.2 }]), undefined);
  assert.equal(clearlyIrrelevantObject([{ label: 'book jacket', probability: 0.99 }]), undefined);
});

test('searchable PDF bytes are extracted instead of passed to image OCR', async () => {
  const content = 'BT /F1 12 Tf 40 740 Td (Government Welfare Pension Scheme) Tj ET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const text = await performOcr('data:application/pdf;base64,' + Buffer.from(pdf).toString('base64'));
  assert.match(text, /Government Welfare Pension Scheme/);
});

test('real agricultural notice image is read locally with no cloud key', { skip: !process.env.TEST_REAL_OCR }, async () => {
  global.fetch = realFetch;
  delete process.env.OCR_LANG_PATH;
  const filename = process.env.TEST_OCR_FILE || path.resolve(__dirname, '../public/documents/bau_ranchi_admission_notice.jpg');
  const data = 'data:image/jpeg;base64,' + fs.readFileSync(filename).toString('base64');
  const result = await analyzeImageIntelligently({ fileBase64: data, fileName: path.basename(filename) });
  assert.equal(result.scopeStatus, 'in_scope');
  assert.match(result.extractedTextSnippet, /agricultur|government|icar|directorate/i);
  assert.ok(result.extractedTextSnippet.length > 100);
  assert.doesNotMatch(result.detectionSummary, /portrait|indoor surroundings|Ramesh Goud/);
});

test('real unrelated room photo is rejected without a cloud key', { skip: !process.env.TEST_ROOM_IMAGE }, async () => {
  global.fetch = realFetch;
  const filename = process.env.TEST_ROOM_IMAGE;
  const bytes = fs.readFileSync(filename);
  const predictions = await classifyImageObjects(bytes);
  console.log('Room object evidence:', JSON.stringify(predictions));
  const result = await analyzeImageIntelligently({ fileBase64: 'data:image/jpeg;base64,' + bytes.toString('base64') });
  assert.equal(result.scopeStatus, 'out_of_scope');
  assert.match(result.title, /Irrelevant/);
});

test('real small scheme poster is analyzed with bundled OCR data', { skip: !process.env.TEST_POSTER_IMAGE }, async () => {
  global.fetch = realFetch;
  delete process.env.OCR_LANG_PATH;
  const bytes = fs.readFileSync(process.env.TEST_POSTER_IMAGE);
  const result = await analyzeImageIntelligently({ fileBase64: 'data:image/png;base64,' + bytes.toString('base64') });
  console.log('Poster OCR:', result.extractedTextSnippet);
  assert.equal(result.scopeStatus, 'in_scope');
  assert.match(answerDocumentQuestion('tell me about this schemes', result, 'en').text, /Suggested next steps/);
});

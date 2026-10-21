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

test('PDF subject questions retain the upload after suggestions and checklist follow-ups', async () => {
  const { parseAndSummarizeDocumentContent } = require('../src/lib/nlpDocumentAnalyzer.ts');
  const text = 'National Institute of Rural Development and Panchayati Raj\nTELANGANA\nA compilation of Central sector, Centrally sponsored and State schemes for convergence under Saansad Adarsh Gram Yojana\nDepartment of Rural Development';
  const detection = { fileName: 'Telangana.pdf', analysisQuality: 'complete', parsedDetails: parseAndSummarizeDocumentContent(text), extractedTextSnippet: text };
  let memory = buildConversationMemory([], 'Analyze Telangana.pdf', undefined, true);
  memory.latestUploadAvailable = true;
  for (const query of ['Give me suggestions', 'What documents are required?', 'what is the doc related to', 'what is it about?', 'Explain this file', 'What is Telangana.pdf about?', 'What is the purpose of the PDF?']) {
    memory = buildConversationMemory([], query, memory);
    const reply = await generateIntelligentChatReply({ query, language: 'en', documentContext: detection, documentContextIsLatestTopic: true, conversationMemory: memory });
    assert.equal(reply.usedDocument, true, query);
    assert.doesNotMatch(reply.text, /Tell me your crop|name of the government scheme/, query);
    if (!/suggestions|required/i.test(query)) assert.match(reply.text, /Central sector|Saansad Adarsh Gram Yojana/, query);
    memory = finishConversationMemory(memory, reply.text);
  }
});

test('an explicit doc reference returns to the upload after a different farming topic', async () => {
  const { shouldUseDocument } = require('../src/lib/chatRouting.ts');
  const detection = { ...poster };
  let memory = buildConversationMemory([], 'Summarize this upload', undefined, true);
  memory.latestUploadAvailable = true;
  memory = buildConversationMemory([], 'How do I irrigate cotton?', memory);
  assert.equal(shouldUseDocument('How do I irrigate cotton?', detection, false), false);
  memory = buildConversationMemory([], 'what is the doc related to', memory);
  assert.equal(memory.topic.kind, 'document');
  const reply = await generateIntelligentChatReply({ query: 'what is the doc related to', language: 'en', documentContext: detection, documentContextIsLatestTopic: false, conversationMemory: memory });
  assert.equal(reply.usedDocument, true);
  assert.match(reply.text, /TELANGANA GOVT SCHEMES AND POLICIES/);
  assert.equal(shouldUseDocument('hai', detection), false);
  assert.equal(shouldUseDocument('Tell me a joke', detection), false);
});

test('the deployed API-Key environment variable is recognized as a Gemini credential', () => {
  const { providerKeys } = require('../src/lib/aiProviders.ts');
  const previous = process.env['API-Key'];
  process.env['API-Key'] = 'synthetic-render-gemini-key';
  try { assert.ok(providerKeys().some(item => item.provider === 'gemini' && item.key === 'synthetic-render-gemini-key')); }
  finally { if (previous === undefined) delete process.env['API-Key']; else process.env['API-Key'] = previous; }
});

test('connection check reports absent, rejected and successful providers without returning keys', async () => {
  const { checkVisionConnections } = require('../src/lib/visionLlm.ts');
  assert.deepEqual(await checkVisionConnections(), { configured: false, checks: [] });
  process.env.GEMINI_API_KEY = 'synthetic-connection-secret';
  try {
    global.fetch = async () => new Response('', { status: 401 });
    let result = await checkVisionConnections();
    assert.equal(result.configured, true);
    assert.equal(result.checks[0].connected, false);
    assert.deepEqual(result.checks[0].failures, ['auth']);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-connection-secret/);
    global.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'out_of_scope', confidenceScore: 1, detectionSummary: 'Blank test image', suggestions: [] }) }] } }] });
    result = await checkVisionConnections();
    assert.equal(result.checks[0].connected, true);
    assert.match(result.checks[0].model, /gemini/);
    assert.doesNotMatch(JSON.stringify(result), /synthetic-connection-secret/);
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('general application follow-up to an upload stays grounded in the uploaded evidence', async () => {
  const { prepareFarmerConversation } = require('../src/lib/farmerChat.ts');
  const memory = buildConversationMemory([], 'Summarize this document', undefined, true);
  memory.latestUploadAvailable = true;
  prepareFarmerConversation('What can I apply for?', memory);
  assert.equal(memory.topic.kind, 'document');
});

test('a restricted default model can recover to an account-available Gemini vision model', async () => {
  const { checkVisionConnections } = require('../src/lib/visionLlm.ts');
  process.env.GEMINI_API_KEY = 'synthetic-restricted-model-key';
  global.fetch = async (url, options) => {
    if (!options.body) return Response.json({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }] });
    if (!url.includes('gemini-2.5-flash:')) return new Response('', { status: 403 });
    assert.equal(JSON.parse(options.body).generationConfig.thinkingConfig.thinkingBudget, 0);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'out_of_scope', detectionSummary: 'Blank test image', confidenceScore: 1, suggestions: [] }) }] } }] });
  };
  try {
    const result = await checkVisionConnections();
    assert.equal(result.checks[0].connected, true);
    assert.equal(result.checks[0].model, 'gemini-2.5-flash');
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

function testPdf(pages) {
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for (const [i, text] of pages.entries()) {
    const stream = `BT /F1 10 Tf 40 740 Td ${(text.match(/.{1,80}/g) || []).map((line, index) => `${index ? "0 -14 Td " : ""}(${line}) Tj`).join("\n")} ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`, `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }
  let pdf = '%PDF-1.4\n'; const offsets = [0];
  objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return 'data:application/pdf;base64,' + Buffer.from(pdf).toString('base64');
}

test('all ninety searchable PDF pages survive extraction and can answer a late-page question', async () => {
  const { analyzeImageIntelligently } = require('../src/lib/visionLlm.ts');
  const { documentSource, retrieveDocumentEvidence } = require('../src/lib/documentEvidence.ts');
  const pages = Array.from({ length: 90 }, (_, i) => `Government Agriculture Scheme Reference Page ${i + 1}. ` + (i === 84 ? 'Lotus Irrigation Scheme. Application office: District Lotus Centre.' : 'Agriculture support information and published guidelines. '.repeat(28)));
  const result = await analyzeImageIntelligently({ fileBase64: testPdf(pages), fileName: 'ninety-pages.pdf' });
  assert.equal(result.visionStatus.state, 'extracted');
  assert.equal(result.extractionCoverage.pagesRead, 90);
  assert.equal(result.extractionCoverage.totalPages, 90);
  assert.equal(result.extractionCoverage.truncated, false);
  const source = documentSource(result);
  assert.ok(source.length > 40000);
  assert.match(source, /\[Page 90\]/);
  assert.match(retrieveDocumentEvidence('Where is the application office for Lotus Irrigation Scheme?', source).map(p => p.text).join('\n'), /District Lotus Centre/);
});

test('Word docx files provide actual paragraph and table text, not image OCR placeholders', async () => {
  const zip = new (require('jszip'))();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Government Farmer Scheme</w:t></w:r></w:p><w:p><w:r><w:t>Required documents:</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Income certificate</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Bank passbook</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
  const bytes = await zip.generateAsync({ type: 'nodebuffer' });
  const { analyzeImageIntelligently } = require('../src/lib/visionLlm.ts');
  const result = await analyzeImageIntelligently({ fileBase64: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,' + bytes.toString('base64'), fileName: 'scheme.docx' });
  assert.equal(result.visionStatus.state, 'extracted');
  assert.equal(result.extractionCoverage.method, 'docx');
  assert.match(answerDocumentQuestion('What documents are required?', result, 'en').text, /Income certificate/);
  assert.match(answerDocumentQuestion('What documents are required?', result, 'en').text, /Bank passbook/);
});

test('research fetches verified official sources and ignores invented search-model claims', async () => {
  const { researchOfficialSchemes, isOfficialSchemeUrl } = require('../src/lib/schemeResearch.ts');
  assert.equal(isOfficialSchemeUrl('https://dept.gov.in.evil.test/notices'), false);
  assert.equal(isOfficialSchemeUrl('http://127.0.0.1/private'), false);
  assert.equal(isOfficialSchemeUrl('https://dept.gov.in/notice'), true);
  process.env.GEMINI_API_KEY = 'synthetic-research-test';
  const fetched = [];
  global.fetch = async (url, options) => {
    fetched.push(url);
    if (url.includes('googleapis')) {
      assert.ok(JSON.parse(options.body).tools[0].google_search);
      return Response.json({ candidates: [{ content: { parts: [{ text: 'Invented benefit 999999 must never become evidence.' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://dept.gov.in/farmer-tools' } }, { web: { uri: 'https://dept.gov.in.evil.test/phishing' } }] } }] });
    }
    assert.equal(url, 'https://dept.gov.in/farmer-tools');
    return new Response('<h1>Farmer Tools Scheme</h1><p>Required documents: Income certificate and bank passbook.</p><p>Apply at the district agriculture office using the published application form.</p>', { headers: { 'content-type': 'text/html' } });
  };
  try {
    const passages = await researchOfficialSchemes('Farmer Tools Scheme required documents');
    assert.ok(passages.length);
    assert.match(passages[0].text, /bank passbook/);
    assert.doesNotMatch(JSON.stringify(passages), /999999|phishing/);
    assert.ok(passages.every(p => p.url === 'https://dept.gov.in/farmer-tools' && p.id.startsWith('R')));
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('chat researches unknown scheme paperwork and answers with official citations', async () => {
  process.env.GEMINI_API_KEY = 'synthetic-research-test';
  global.fetch = async (url, options) => {
    if (!url.includes('googleapis')) return new Response('<h1>New Farmer Tools Scheme</h1><p>Required documents: Income certificate and bank passbook.</p><p>Applications are submitted to the district agriculture office.</p>', { headers: { 'content-type': 'text/html' } });
    const payload = JSON.parse(options.body);
    if (payload.tools) return Response.json({ candidates: [{ groundingMetadata: { groundingChunks: [{ web: { uri: 'https://dept.gov.in/new-farmer-tools' } }] } }] });
    assert.match(payload.systemInstruction.parts[0].text, /R1/);
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ claims: [{ text: 'Prepare an income certificate and bank passbook.', sourceId: 'R1', quote: 'Required documents: Income certificate and bank passbook.' }], suggestions: [], missingInformation: [], chips: ['How do I apply?'] }) }] } }] });
  };
  try {
    const reply = await generateIntelligentChatReply({ query: 'What documents are required for New Farmer Tools Scheme?', language: 'en' });
    assert.equal(reply.provider, 'gemini');
    assert.match(reply.text, /bank passbook/);
    assert.match(reply.text, /https:\/\/dept.gov.in\/new-farmer-tools/);
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('retrieval reaches beyond old chunk limits and keeps scheme headings with a late checklist', () => {
  const { retrieveDocumentEvidence, chunkDocument } = require('../src/lib/documentEvidence.ts');
  const text = Array.from({ length: 160 }, (_, i) => `[Page ${i + 1}]\n${i === 155 ? 'Lotus Farmer Tools Scheme' : 'Other Agriculture Scheme ' + i}\n${'Ordinary published farming guidance. '.repeat(32)}\nRequired documents:\n${i === 155 ? 'Lotus residence certificate\nLotus bank passbook' : 'Other district income certificate'}`).join('\n');
  assert.ok(chunkDocument(text).length > 120);
  const evidence = retrieveDocumentEvidence('What documents are required for Lotus Farmer Tools Scheme?', text, 6);
  assert.match(evidence.map(p => p.text).join('\n'), /Lotus residence certificate/);
  assert.ok(evidence.some(p => p.page === 156));
});

test('failed live research cannot turn saved data into a latest-scheme announcement', async () => {
  process.env.GEMINI_API_KEY = 'synthetic-research-failure';
  global.fetch = async () => new Response('', { status: 401 });
  try {
    const answer = await generateIntelligentChatReply({ query: 'What are the latest government schemes for farmers?', language: 'en' });
    assert.match(answer.text, /could not verify a current official notice/);
    assert.doesNotMatch(answer.text, /new scheme launched|applications are open/i);
  } finally { delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

test('a grounded response that fails validation gets one repair attempt rather than an immediate generic reply', async () => {
  process.env.GROQ_API_KEY = 'gsk_synthetic-repair';
  let calls = 0;
  global.fetch = async () => {
    calls++;
    return Response.json({ choices: [{ message: { content: calls === 1 ? 'Unstructured answer without evidence' : JSON.stringify({ claims: [{ text: 'The poster mentions Rythu Bharosa.', sourceId: 'D1', quote: 'Rythu Bharosa' }], suggestions: [], missingInformation: [], chips: [] }) } }] });
  };
  try {
    const reply = await generateIntelligentChatReply({ query: 'Which schemes are mentioned?', language: 'en', documentContext: poster, forceDocumentContext: true });
    assert.equal(calls, 2);
    assert.equal(reply.provider, 'groq');
    assert.match(reply.text, /Rythu Bharosa/);
  } finally { delete process.env.GROQ_API_KEY; global.fetch = realFetch; }
});

test('a named scheme question immediately after a document stays with its uploaded facts', async () => {
  const { parseAndSummarizeDocumentContent } = require('../src/lib/nlpDocumentAnalyzer.ts');
  const text = 'Government Farmer Scheme\nPM-KISAN\nRequired documents:\nLocal applicant residence certificate\nBank passbook';
  const detection = { parsedDetails: parseAndSummarizeDocumentContent(text), analysisQuality: 'complete' };
  let memory = buildConversationMemory([], 'Summarize this document', undefined, true);
  memory.latestUploadAvailable = true;
  memory = buildConversationMemory([], 'What documents are required for PM-KISAN?', memory);
  const reply = await generateIntelligentChatReply({ query: 'What documents are required for PM-KISAN?', language: 'en', documentContext: detection, documentContextIsLatestTopic: true, conversationMemory: memory });
  assert.equal(reply.usedDocument, true);
  assert.match(reply.text, /Local applicant residence certificate/);
});

test('a multi-scheme booklet asks which scheme before mixing its document checklists', async () => {
  const text = 'Government Schemes Guide\nPM-KISAN\nRequired documents: Bank passbook\nPMFBY\nRequired documents: Insurance application';
  const { parseAndSummarizeDocumentContent } = require('../src/lib/nlpDocumentAnalyzer.ts');
  let memory = buildConversationMemory([], 'Please analyze this attached government document: guide.pdf', undefined, true);
  memory.latestUploadAvailable = true;
  memory = buildConversationMemory([], 'What documents are required?', memory);
  const reply = await generateIntelligentChatReply({ query: 'What documents are required?', language: 'en', documentContext: { parsedDetails: parseAndSummarizeDocumentContent(text) }, conversationMemory: memory });
  assert.equal(reply.usedDocument, true);
  assert.match(reply.text, /Which scheme should I explain/);
  assert.match(reply.text, /PM-KISAN/);
  assert.match(reply.text, /PMFBY/);
});

test('scanned PDF vision begins without waiting for local OCR to finish', { timeout: 6000 }, async () => {
  const ocr = require('../src/lib/ocrEngine.ts');
  const original = ocr.analyzeDocumentComprehensive;
  let finishLocal;
  ocr.analyzeDocumentComprehensive = () => new Promise(resolve => { finishLocal = resolve; });
  process.env.GEMINI_API_KEY = 'synthetic-parallel-pdf';
  global.fetch = async () => {
    finishLocal({ scopeStatus: 'uncertain', isAgriRelated: false, confidenceScore: 0, suggestions: [], extractedTextSnippet: '' });
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ scopeStatus: 'in_scope', confidenceScore: .9, detectionSummary: 'A government farmer notice.', extractedTextSnippet: 'Government Farmer Scheme\nApplicant: Meena Devi', suggestions: [] }) }] } }] });
  };
  try {
    const { analyzeImageIntelligently } = require('../src/lib/visionLlm.ts');
    const result = await analyzeImageIntelligently({ fileBase64: 'data:application/pdf;base64,c3ludGhldGlj', fileName: 'scan.pdf' });
    assert.equal(result.visionStatus.state, 'cloud');
    assert.match(result.extractedTextSnippet, /Meena Devi/);
  } finally { ocr.analyzeDocumentComprehensive = original; delete process.env.GEMINI_API_KEY; global.fetch = realFetch; }
});

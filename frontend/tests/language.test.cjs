const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return originalResolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args);
};
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};

const { answerCropImage } = require('../src/lib/imageEvidence.ts');
const { answerDocumentQuestion, parseAndSummarizeDocumentContent } = require('../src/lib/nlpDocumentAnalyzer.ts');
const { visionPromptForLanguage } = require('../src/lib/visionLlm.ts');

test('crop image advice follows the requested language and known crop context', () => {
  const detection = { docType: 'crop_disease', cropAnalysis: {
    observations: ['పాత ఆకులు పసుపుగా ఉన్నాయి'],
    possibleCauses: [{ name: 'నీరు నిల్వ', evidence: 'వేర్ల వద్ద తడి', check: 'నేల తడిని చూడండి' }],
    nextSteps: ['పొలంలో నీరు నిలుస్తుందో చూడండి'], questions: ['ఏ పంట?'], limitations: [],
  } };
  const reply = answerCropImage('ఏం చేయాలి?', detection, { crop: 'cotton', cropAge: '40 days' }, 'te');
  assert.match(reply.text, /చిత్రంలో కనిపిస్తున్నది/);
  assert.match(reply.text, /తదుపరి చర్యలు/);
  assert.match(reply.text, /పొలంలో నీరు నిలుస్తుందో చూడండి/);
  assert.doesNotMatch(reply.text, /What crop is this\?|ఏ పంట\?/);
  assert.ok(reply.chips.every((chip) => /[\u0C00-\u0C7F]/u.test(chip)));
  const identity = answerCropImage('कौन सी फसल?', { cropAnalysis: { observations: [] } }, { crop: 'cotton' }, 'hi');
  assert.match(identity.text, /आपने बताया/);
  assert.match(identity.text, /तस्वीर/);
});

test('document fallback keeps printed values and uses selected language for guidance', () => {
  const source = 'Government Welfare Department\nPension Scheme Application\nApplicant: Meena Devi\nLast date: 30.11.2026\nRequired documents:\nIncome certificate\nAadhaar card';
  const detection = { parsedDetails: parseAndSummarizeDocumentContent(source) };
  const telugu = answerDocumentQuestion('సారాంశం', detection, 'te');
  assert.match(telugu.text, /పత్రం సారాంశం/);
  assert.match(telugu.text, /తదుపరి చర్యల సూచనలు/);
  assert.match(telugu.text, /Meena Devi/);
  assert.match(telugu.text, /30\.11\.2026/);
  assert.ok(telugu.chips.every((chip) => /[\u0C00-\u0C7F]/u.test(chip)));
  const hindi = answerDocumentQuestion('Give suggestions', detection, 'hi');
  assert.match(hindi.text, /अगले कदम/);
  assert.match(hindi.text, /आवेदन से पहले/);
  assert.doesNotMatch(hindi.text, /Check the issuing department/);
});

test('vision extraction requests explanatory language but preserves source transcription', () => {
  for (const [code, name] of [['te', 'Telugu'], ['hi', 'Hindi'], ['ta', 'Tamil'], ['kn', 'Kannada'], ['bn', 'Bengali']]) {
    const prompt = visionPromptForLanguage(code);
    assert.match(prompt, new RegExp(`in ${name}`));
    assert.match(prompt, /Preserve names, figures, dates, table content, and extractedTextSnippet exactly as printed/);
  }
});

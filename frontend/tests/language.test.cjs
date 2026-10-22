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
const { farmerChatReply, schemeReferences } = require('../src/lib/farmerChat.ts');
const { usesAnswerLanguage, preferredChatLanguage, answerFailureNotice } = require('../src/lib/answerLanguage.ts');
const { GUEST_FARMER } = require('../src/lib/mockData.ts');

const farmerQuery='I am a marginal farmer from Andhra Pradesh with 2.5 acres of dry land growing groundnut. What central and state government schemes am I eligible for to get financial assistance and subsidized drip irrigation?';
test('the reported groundnut and drip question gets contextual recommendations instead of asking for a scheme or known state', () => {
  const reply=farmerChatReply(farmerQuery,'en');
  assert.match(reply.text,/Andhra Pradesh/); assert.match(reply.text,/groundnut/); assert.match(reply.text,/2\.5/);
  assert.match(reply.text,/APMIP/); assert.match(reply.text,/land records|Land/); assert.match(reply.text,/bank/);
  assert.doesNotMatch(reply.text,/Which scheme do you mean|Which state/);
  assert.ok(schemeReferences(farmerQuery).some(s=>/Micro Irrigation/.test(s.name)));
  const memory=require('../src/lib/conversationMemory.ts').buildConversationMemory([],farmerQuery);
  assert.equal(memory.facts.crop,'groundnut'); assert.equal(memory.facts.irrigation,undefined);
});
test('questions about two schemes answer both with paperwork and application guidance', () => {
  const query='I have 3 acres of agricultural land. What documents are needed to register for PM-Kisan and crop insurance, and how to apply?';
  const reply=farmerChatReply(query,'en');
  assert.match(reply.text,/PM-KISAN/); assert.match(reply.text,/PMFBY/);
  assert.match(reply.text,/Aadhaar/); assert.match(reply.text,/IFSC/); assert.match(reply.text,/sowing/);
  assert.equal((reply.text.match(/Application:/g)||[]).length,2);
  const refs=schemeReferences(query); assert.ok(refs.some(r=>/Kisan|KISAN/.test(r.name))); assert.ok(refs.some(r=>/Fasal|PMFBY/.test(r.name)));
});
test('the reported interveinal tomato symptom gets specific triage without a definite diagnosis or spray dose', () => {
  const reply=farmerChatReply('My tomato crop leaves are turning pale yellow between the veins while the veins stay green, and the upper leaves are curling slightly. What is happening and what should I do immediately','en');
  assert.match(reply.text,/interveinal chlorosis/); assert.match(reply.text,/Iron|iron/); assert.match(reply.text,/magnesium/);
  assert.match(reply.text,/whiteflies|mites/); assert.match(reply.text,/soil\/leaf testing/); assert.match(reply.text,/older lower leaves/);
  assert.doesNotMatch(reply.text,/definitely|\d+\s*(?:ml|kg|grams)/);
});
test('all crop fallback topics and broad recommendations follow every supported regional language even for English questions', () => {
  const queries=['My crop leaves are yellow','How should I water my crop?','How do I choose fertilizer for my soil?','Pest disease advice for cotton','How do I choose seed for sowing?','How to make compost?','How to control weeds?','What is the weather forecast?','What is the market price?'];
  const scripts={te:/[\u0C00-\u0C7F]/,hi:/[\u0900-\u097F]/,ta:/[\u0B80-\u0BFF]/,kn:/[\u0C80-\u0CFF]/,bn:/[\u0980-\u09FF]/};
  for(const lang of Object.keys(scripts)) {
    for(const query of [...queries,farmerQuery]) {
      const reply=farmerChatReply(query,lang,{...GUEST_FARMER,primaryCrops:['Cotton']});
      assert.ok(usesAnswerLanguage(reply.text,lang),`${lang}: ${query}: ${reply.text}`);
      assert.ok(reply.chips.every(c=>scripts[lang].test(c)));
      assert.doesNotMatch(reply.text,/Yellow leaves can result|Irrigation depends|Which crop are you growing/);
    }
  }
});
test('a saved language choice takes priority over a different profile language at sign-in', () => {
  assert.equal(preferredChatLanguage('te','en','en'),'te');
  assert.equal(preferredChatLanguage('hi','te','te'),'hi');
  assert.equal(preferredChatLanguage(null,'ta','en'),'ta');
  assert.equal(preferredChatLanguage('invalid','invalid','kn'),'kn');
});
test('the language guard rejects English prose for a regional answer while allowing original source excerpts', () => {
  assert.equal(usesAnswerLanguage('You should take your land records to the district agriculture office.','te'),false);
  assert.equal(usesAnswerLanguage('మీ భూమి పత్రాలను జిల్లా వ్యవసాయ కార్యాలయానికి తీసుకెళ్లండి.\n---\nGovernment notice: Original English source evidence.','te'),true);
  for (const lang of ['te','hi','ta','kn','bn']) assert.ok(usesAnswerLanguage(answerFailureNotice('The provider usage limit was reached.',lang),lang));
});

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

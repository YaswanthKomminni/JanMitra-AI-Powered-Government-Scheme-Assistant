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

const { classifyTextTurn, queryWithHistory, shouldUseDocument } = require('../src/lib/chatRouting.ts');
const { buildConversationMemory, finishConversationMemory } = require('../src/lib/conversationMemory.ts');
const { farmerChatReply, nonDomainChatReply, schemeReferences } = require('../src/lib/farmerChat.ts');

test('a greeting after a scheme question never retrieves that scheme', () => {
  let memory = buildConversationMemory([], 'What is PM-KISAN?');
  memory = finishConversationMemory(memory, 'PM-KISAN supports eligible families. What else would you like to know?');
  memory = buildConversationMemory([], 'helloo', memory);
  assert.equal(classifyTextTurn('helloo', memory), 'greeting');
  assert.equal(queryWithHistory('helloo', [{ role: 'user', content: 'What is PM-KISAN?' }]), 'helloo');
  assert.deepEqual(schemeReferences('helloo'), []);
  const reply = farmerChatReply('helloo', 'en', null, [], memory);
  assert.match(reply.text, /Hello/);
  assert.doesNotMatch(reply.text, /PM-KISAN|Gujarat|chaff cutter/i);
});

test('unrelated requests clear an old scheme topic and receive a relevant-domain invitation', () => {
  let memory = buildConversationMemory([], 'What is PM-KISAN?');
  memory = buildConversationMemory([], 'What is the capital of India?', memory);
  assert.equal(classifyTextTurn('What is the capital of India?', memory), 'off_topic');
  assert.equal(memory.topic, undefined);
  assert.equal(queryWithHistory('What is the capital of India?', [{ role: 'user', content: 'What is PM-KISAN?' }]), 'What is the capital of India?');
  const reply = farmerChatReply('What is the capital of India?', 'en', null, [], memory);
  assert.match(reply.text, /Please ask about agriculture or government welfare schemes/);
  assert.doesNotMatch(reply.text, /PM-KISAN|Gujarat/i);
});

test('short replies keep a live scheme topic, while a new crop question switches topics', () => {
  let memory = buildConversationMemory([], 'What is PM-KISAN?');
  memory = finishConversationMemory(memory, 'Which state are you in?');
  memory = buildConversationMemory([], 'Telangana', memory);
  assert.equal(classifyTextTurn('Telangana', memory), 'contextual');
  memory = buildConversationMemory([], 'How to apply?', memory);
  assert.equal(classifyTextTurn('How to apply?', memory), 'contextual');
  assert.match(queryWithHistory('How to apply?', [{ role: 'user', content: 'What is PM-KISAN?' }]), /PM-KISAN/);
  memory = buildConversationMemory([], 'How should I irrigate cotton?', memory);
  assert.equal(classifyTextTurn('How should I irrigate cotton?', memory), 'relevant');
  assert.equal(memory.topic.kind, 'crop');
});

test('greetings and off-topic responses respect all supported languages', () => {
  for (const [language, greeting, offTopic] of [
    ['en', 'Hello', 'Please ask'], ['te', 'నమస్కారం', 'దయచేసి'],
    ['hi', 'नमस्ते', 'कृपया'], ['ta', 'வணக்கம்', 'தயவுசெய்து'],
    ['kn', 'ನಮಸ್ಕಾರ', 'ದಯವಿಟ್ಟು'], ['bn', 'নমস্কার', 'অনুগ্রহ'],
  ]) {
    assert.match(nonDomainChatReply('helloo', language).text, new RegExp(greeting));
    assert.match(nonDomainChatReply('Tell me a joke', language).text, new RegExp(offTopic));
  }
});

test('old document context is ignored for greetings and clearly unrelated requests', () => {
  const document = { docType: 'scheme_document' };
  assert.equal(shouldUseDocument('helloo', document), false);
  assert.equal(shouldUseDocument('Write me a poem', document), false);
  assert.equal(shouldUseDocument('What documents are required?', document), true);
});

test('welfare scheme topics are not rejected just because their sector is not agriculture', () => {
  assert.equal(classifyTextTurn('Government scholarship scheme for football students'), 'relevant');
  assert.equal(classifyTextTurn('Tourism subsidy scheme in my state'), 'relevant');
  assert.equal(classifyTextTurn('How can I improve compost for my field?'), 'relevant');
  assert.equal(classifyTextTurn('Tell me a joke about government schemes'), 'off_topic');
  assert.equal(classifyTextTurn('Explain an unfamiliar term'), 'unknown');
});

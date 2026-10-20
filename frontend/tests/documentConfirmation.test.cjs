const {test, after} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename;
const originalLoad = Module._load;
Module._resolveFilename = function(name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true},
}).outputText, filename);
let vision;
let writes = [];
let status = 'analyzed';
let increments = 0;
const client = {query: async (sql, params) => {
  if (sql.startsWith('SELECT')) {
    assert.match(sql, /id = \$1 AND user_id = \$2 FOR UPDATE/);
    return {rows: params[0] === 42 && params[1] === 7 ? [{id: 42, status}] : []};
  }
  if (sql.startsWith('UPDATE document_verifications')) { assert.deepEqual(params, [42, 7]); status = 'user_confirmed'; }
  if (sql.startsWith('UPDATE users')) { assert.deepEqual(params, [7]); increments++; }
  return {rows: []};
}};
Module._load = function(name, ...args) {
  if (name === 'server-only') return {};
  if (name === '@/lib/auth') return {requireUser: async () => ({dbId: 7}), serviceUnavailable: message => Response.json({success: false, message}, {status: 503})};
  if (name === '@/lib/db') return {withTransaction: async fn => fn(client), queryDatabase: async (sql, params) => {writes.push({sql, params}); return {success: true, data: [{id: 42}]}; }};
  if (name === '@/lib/visionLlm') return {analyzeImageIntelligently: async () => vision};
  return originalLoad.call(this, name, ...args);
};
after(() => {Module._load = originalLoad; Module._resolveFilename = resolve;});
const {POST} = require('../src/app/api/verify-doc/route.ts');
const {analyzeAndRecordDocument} = require('../src/lib/documentAnalysis.ts');
const post = body => POST(new Request('http://localhost/api/verify-doc', {method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)}));

test('a complete analysis saves a server record without increasing the reviewed count', async () => {
  writes = [];
  vision = {scopeStatus: 'in_scope', isAgriRelated: true, docType: 'land_record', title: 'Land record', confidenceScore: .7, extractedData: {owner: 'Meena'}, suggestions: []};
  const result = await analyzeAndRecordDocument({userId: 7, fileBase64: 'data:image/png;base64,c3ludGhldGlj'});
  assert.equal(result.success, true);
  assert.equal(result.detection.analysisRecordId, 42);
  assert.equal(writes.length, 1);
  assert.match(writes[0].sql, /'analyzed'/);
  assert.equal(writes[0].params[0], 7);
});

test('unrelated and partial uploads cannot create confirmable records', async () => {
  writes = [];
  vision = {scopeStatus: 'out_of_scope', analysisQuality: 'partial', isAgriRelated: false, detectionSummary: 'Room', suggestions: []};
  const rejected = await analyzeAndRecordDocument({userId: 7, fileBase64: 'synthetic'});
  assert.equal(rejected.success, false);
  assert.equal(rejected.isOutOfScope, true);
  vision = {scopeStatus: 'in_scope', analysisQuality: 'partial', isAgriRelated: true, detectionSummary: 'Fine print unclear', suggestions: []};
  const partial = await analyzeAndRecordDocument({userId: 7, fileBase64: 'synthetic'});
  assert.equal(partial.success, true);
  assert.equal(partial.detection.analysisRecordId, undefined);
  assert.equal(writes.length, 0);
});

test('client-supplied extracted facts cannot create a verified document', async () => {
  const response = await post({docType: 'land_record', extractedData: {landAreaAcres: 1000}, confidenceScore: .99});
  assert.equal(response.status, 400);
  assert.equal(increments, 0);
});

test('confirmation is owner-scoped and repeated confirmation increments only once', async () => {
  assert.equal((await post({analysisRecordId: 99})).status, 404);
  assert.equal((await post({analysisRecordId: 42, userId: 999, extractedData: {landAreaAcres: 1000}})).status, 200);
  assert.equal((await post({analysisRecordId: 42})).status, 200);
  assert.equal(status, 'user_confirmed');
  assert.equal(increments, 1);
});

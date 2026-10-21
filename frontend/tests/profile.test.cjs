const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const resolve = Module._resolveFilename, load = Module._load;
Module._resolveFilename = function(name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { NextResponse } = require('next/server');
let signedIn = true, queries = [], documents = [], profileRow = { id: 7, name: 'Farmer', phone: '9876543210' }, registered = [];
const authMock = {
  requireUser: async () => signedIn ? { dbId: 7, profile: { id: 'farmer_7', state: 'Telangana', district: 'Warangal' } } : NextResponse.json({message:'Sign in'}, {status:401}),
  getSessionUser: async () => signedIn ? { dbId: 7, profile: { state: 'Telangana', district: 'Warangal' } } : null,
  normalizePhone: v => /^[6-9]\d{9}$/.test(v) ? v : null,
  normalizeEmail: v => !v ? null : /^[^@]+@[^@]+\.[^@]+$/.test(v) ? v : 'invalid',
};
async function query(sql, params = []) {
  queries.push({sql,params});
  if (/FROM profile_documents/.test(sql)) return documents.filter(d => d.user_id === params[0] || /^DELETE/.test(sql) && d.user_id === params[1]).filter(d => !/id=\$2|id=\$1 AND/.test(sql) || d.id === (/^DELETE/.test(sql) ? params[0] : params[1]));
  if (/JOIN farmer_preferences/.test(sql)) return registered;
  if (/FROM users u WHERE/.test(sql)) return [profileRow];
  if (/SELECT share_contact/.test(sql)) return [{share_contact:false}];
  return [];
}
Module._load = function(name, parent, main) {
  if (name === 'server-only') return {};
  if (name === '@/lib/auth') return authMock;
  if (name === '@/lib/db') return { dbQuery: query, queryDatabase: async () => ({success:true,data:[]}), isUniqueViolation: () => false, withTransaction: async fn => fn({ query: async (sql, params) => ({ rows: await query(sql, params) }) }) };
  if (name === '@/lib/visionLlm') return { analyzeImageIntelligently: async () => ({ scopeStatus:'in_scope', extractedTextSnippet:'Government Land Record\nOwner: Farmer\nSurvey Number: 123/4', docType:'land_record' }) };
  return load.call(this,name,parent,main);
};
after(() => { Module._load = load; Module._resolveFilename = resolve; });
const profile = require('../src/app/api/profile/route.ts');
const vault = require('../src/app/api/profile/documents/route.ts');
const file = require('../src/app/api/profile/documents/[id]/route.ts');
const peers = require('../src/app/api/peers/route.ts');
const { savedProfileContext } = require('../src/lib/profileStorage.ts');
const request = (body, method='PATCH') => new Request('https://example.test/api/profile', {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
const validProfile = { name:'Lakshmi', phone:'9876543210', email:'', state:'Telangana', district:'Warangal', village:'Village', primaryCrops:'Chilli', landSizeAcres:'12', annualIncomeSlab:'', soilType:'red_soil', irrigationType:'drip', preferredLanguage:'te', shareContact:true, userId:999 };

test('profile edits use the session owner, support optional email and farm details, and store explicit contact consent', async () => {
  queries=[]; signedIn=true;
  const res=await profile.PATCH(request(validProfile)); assert.equal(res.status,200);
  const update=queries.find(q=>/UPDATE users SET/.test(q.sql));
  assert.equal(update.params[0],7); assert.equal(update.params[3],null); assert.equal(update.params[7],'Chilli'); assert.equal(update.params[8],12);
  const consent=queries.find(q=>/INSERT INTO farmer_preferences/.test(q.sql)); assert.deepEqual(consent.params,[7,true]);
  assert.match(res.headers.get('Cache-Control'),/no-store/);
});
test('invalid mobile, negative acreage and opting in without district are rejected before update', async () => {
  for(const changes of [{phone:'123'}, {landSizeAcres:-1}, {district:''}]) {
    queries=[]; const res=await profile.PATCH(request({...validProfile,...changes})); assert.equal(res.status,400);
    assert.ok(!queries.some(q=>/UPDATE users SET/.test(q.sql)));
  }
});
test('private profile endpoints reject unauthenticated access', async () => {
  signedIn=false;
  try { for(const res of [await profile.GET(new Request('https://example.test')),await vault.GET(new Request('https://example.test')), await file.GET(new Request('https://example.test'),{params:{id:'11111111-1111-1111-1111-111111111111'}})]) assert.equal(res.status,401); }
  finally {signedIn=true;}
});
test('saved document list excludes originals and analysis text, and the storage query is scoped to the signed-in user', async () => {
  documents=[]; queries=[];
  const res=await vault.GET(new Request('https://example.test')); assert.equal(res.status,200);
  const q=queries.find(q=>/SELECT id,file_name,created_at/.test(q.sql)); assert.deepEqual(q.params,[7]); assert.doesNotMatch(q.sql,/SELECT .*file_data/);
});
test('saving a document extracts source text once and binds the original to the session owner', async () => {
  documents=[]; queries=[];
  const res=await vault.POST(request({data:'data:text/plain;base64,'+Buffer.from('Government Land Record').toString('base64'),name:'Land.txt', userId:999},'POST'));
  assert.equal(res.status,200);
  const insert=queries.find(q=>/INSERT INTO profile_documents/.test(q.sql)); assert.equal(insert.params[1],7);
  assert.match(JSON.parse(insert.params[5]).extractedTextSnippet,/Survey Number: 123\/4/);
});
test('a selected document owned by someone else is not available to chat or download', async () => {
  const id='11111111-1111-1111-1111-111111111111'; documents=[{id,user_id:999,analysis:{extractedTextSnippet:'PRIVATE OTHER USER'}}]; queries=[];
  assert.equal(await savedProfileContext(7,'summarize',id),undefined);
  const res=await file.GET(new Request('https://example.test'),{params:{id}}); assert.equal(res.status,404);
  const sourceQuery=queries.find(q=>/SELECT id, file_name, analysis/.test(q.sql)); assert.deepEqual(sourceQuery.params,[7,id]);
});
test('deleting a saved document includes ownership and an invalid identifier never reaches the database', async () => {
  queries=[];
  assert.equal((await file.DELETE(new Request('https://example.test'),{params:{id:'invalid'}})).status,400);
  assert.equal(queries.length,0);
  await file.DELETE(new Request('https://example.test'),{params:{id:'11111111-1111-1111-1111-111111111111'}});
  const deletion=queries.find(q=>/^DELETE/.test(q.sql)); assert.equal(deletion.params[1],7); assert.match(deletion.sql,/user_id=\$2/);
});
test('registered directory peers require opt-in and matching state/district; district matching does not invent distance', async () => {
  registered=[{id:8,name:'Member',phone:'9876543211',village:'Nearby village',primary_crops:'Chilli'}]; queries=[];
  const res=await peers.GET(new Request('https://example.test')); const data=await res.json(); const member=data.peers.find(p=>p.id==='member-8');
  assert.equal(member.contactPhone,'9876543211'); assert.equal(member.contactAllowed,true); assert.equal(member.distanceKnown,false);
  const q=queries.find(q=>/JOIN farmer_preferences/.test(q.sql)); assert.match(q.sql,/p.share_contact=true/); assert.match(q.sql,/u.id<>\$1/); assert.deepEqual(q.params,[7,'Telangana','Warangal']);
  assert.match(res.headers.get('Cache-Control'),/private/);
});
test('anonymous directory responses contain no registered member contacts', async () => {
  signedIn=false;
  try { const data=await (await peers.GET(new Request('https://example.test'))).json(); assert.ok(data.peers.every(p=>p.isDemo)); assert.ok(data.peers.every(p=>p.contactPhone)); }
  finally { signedIn=true; }
});

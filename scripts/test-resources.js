const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const {Readable} = require('stream');
const {execFileSync} = require('child_process');
const {createRequire} = require('module');
const {auditResources, cleanResources, collectReferences} = require('../lib/resources');
const project = path.resolve(__dirname, '..');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skillpath-resources-'));
  t.after(() => {
    if (path.dirname(root) !== os.tmpdir() || !path.basename(root).startsWith('skillpath-resources-')) throw new Error('Unexpected fixture path');
    fs.rmSync(root, {recursive:true, force:true});
  });
  return root;
}
function write(root, name, content) { const file = path.join(root, name); fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, content); }
function catalogue(...names) { return {courses:names.map((name,i) => ({id:'course-'+i, lessons:[{id:'lesson-'+i, blocks:[{type:'theory', media:'/content/assets/'+name}]}]}))}; }
function save(root, value, scope = '') { write(root, scope+'content/courses.json', JSON.stringify(value)); }

test('audit checks all courses, nested and encoded references, missing files and release independently', t => {
  const root=fixture(t);
  save(root,catalogue('shared.png','nested/space%20name.gif','missing.mp4'));
  for (const name of ['shared.png','nested/space name.gif','orphan.png']) write(root,'content/assets/'+name,'data');
  save(root,catalogue('old.png'),'release/');
  write(root,'release/content/assets/old.png','old');write(root,'release/content/assets/orphan.png','orphan');
  const targets=auditResources(root);
  assert.deepEqual(targets[0].unused.map(file=>file.name),['orphan.png']);
  assert.deepEqual(targets[0].missing,['missing.mp4']);
  assert.deepEqual(targets[1].unused.map(file=>file.name),['orphan.png']);
  assert(!collectReferences({media:'/content/assets/../outside.png'}).size);
});

test('cleanup protects saved and draft references and moves only the checked unused files', t => {
  const root=fixture(t);save(root,catalogue('saved.png'));
  for (const name of ['saved.png','draft.png','orphan.gif']) write(root,'content/assets/'+name,'data');
  const draft=catalogue('draft.png');const snapshot=auditResources(root,draft);
  assert.deepEqual(snapshot[0].unused.map(file=>file.name),['orphan.gif']);
  write(root,'content/assets/after-scan.png','new');
  const result=cleanResources(root,snapshot,draft);
  assert.equal(result.moved.length,1);
  assert(fs.existsSync(path.join(root,result.backup,'source/orphan.gif')));
  for(const name of ['saved.png','draft.png','after-scan.png'])assert(fs.existsSync(path.join(root,'content/assets',name)));
});

test('cleanup rechecks changed files and newly used references after the preview', t => {
  const root=fixture(t);save(root,catalogue('keep.png'));
  for(const name of ['keep.png','changed.png','now-used.png'])write(root,'content/assets/'+name,'data');
  const snapshot=auditResources(root);
  write(root,'content/assets/changed.png','changed contents');
  save(root,catalogue('keep.png','now-used.png'));
  const result=cleanResources(root,snapshot);
  assert.equal(result.moved.length,0);assert.equal(result.skipped.length,2);assert.equal(result.backup,null);
});

test('invalid catalogues stop cleanup instead of classifying everything as unused', t => {
  const root=fixture(t);save(root,catalogue('keep.png'));write(root,'content/assets/keep.png','data');
  const snapshot=auditResources(root);write(root,'content/courses.json','{}');
  assert.throws(()=>cleanResources(root,snapshot));
  assert(fs.existsSync(path.join(root,'content/assets/keep.png')));
});

function apiServer(root, mode, childProcess) {
  let handler;
  const source=fs.readFileSync(path.join(project,'server.js'),'utf8').replace(/^start\(Number\(args\.port.*$/m,'');
  const realRequire=createRequire(path.join(project,'server.js'));
  const context=vm.createContext({require:name=>name==='http'?{createServer:fn=>{handler=fn;return {}}}:name==='child_process'&&childProcess?childProcess:realRequire(name),process:{argv:['node','server.js','--root='+root,'--mode='+mode],platform:childProcess?'win32':process.platform,env:process.env},console,Buffer});
  vm.runInContext(source,context);
  return async(url,data) => {
    const req=Readable.from([JSON.stringify(data)]);req.url=url;req.method='POST';let status,body;
    await handler(req,{writeHead:code=>{status=code},end:text=>{body=JSON.parse(text)}});
    return {status,body};
  };
}

test('admin API requires a preview token and learner mode cannot scan or clean', async t => {
  const root=fixture(t);save(root,catalogue('keep.png'));
  write(root,'content/assets/keep.png','data');write(root,'content/assets/orphan.png','data');
  const api=apiServer(root,'admin');
  assert.equal((await api('/api/resources/clean',{token:'fake'})).status,409);
  const check=await api('/api/resources/check',{});assert.equal(check.status,200);
  const clean=await api('/api/resources/clean',{token:check.body.token});assert.equal(clean.status,200);assert.equal(clean.body.moved.length,1);
  assert.equal((await api('/api/resources/clean',{token:check.body.token})).status,409);
  const learner=apiServer(root,'learn');
  assert.equal((await learner('/api/resources/check',{})).status,403);
  assert.equal((await learner('/api/resources/clean',{})).status,403);
});

test('release terminal is detached and the admin continues answering requests', async t => {
  const root=fixture(t);save(root,catalogue('keep.png'));write(root,'build-release.bat','@echo off');
  const {EventEmitter}=require('events');let launched,unreferenced=false;
  const childProcess={spawn(command,args,options){launched={command,args,options};const child=new EventEmitter();child.unref=()=>{unreferenced=true};queueMicrotask(()=>child.emit('spawn'));return child}};
  const api=apiServer(root,'admin',childProcess);
  assert.equal((await api('/api/build-release',{})).status,200);
  assert.equal(launched.options.detached,true);assert.equal(launched.options.windowsHide,false);
  assert.equal(launched.options.cwd,root);assert.equal(launched.args.join(' '),'/d /c build-release.bat');assert(unreferenced);
  assert.equal((await api('/api/resources/check',{})).status,200);
  const learner=apiServer(root,'learn',childProcess);assert.equal((await learner('/api/build-release',{})).status,403);
});

test('real Windows terminal launches a BAT without blocking admin requests', {skip:process.env.SKILLPATH_TEST_REAL_TERMINAL!=='1'||process.platform!=='win32'}, async t => {
  const root=fixture(t);save(root,catalogue('keep.png'));
  write(root,'build-release.bat','@echo off\r\necho ready>terminal-launched.txt\r\n');
  const api=apiServer(root,'admin',require('child_process'));
  assert.equal((await api('/api/build-release',{})).status,200);
  const marker=path.join(root,'terminal-launched.txt');
  for(let i=0;i<100&&!fs.existsSync(marker);i++)await new Promise(resolve=>setTimeout(resolve,50));
  assert(fs.existsSync(marker),'The BAT must actually run in its own terminal');
  assert.equal((await api('/api/resources/check',{})).status,200);
});

test('admin report escapes filenames, sends drafts and disables cleanup after completion', async () => {
  const nodes=new Map();const calls=[];
  const document={querySelector(selector){if(selector.startsWith('[data-'))return null;if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',disabled:false,open:false,showModal(){this.open=true}});return nodes.get(selector)},querySelectorAll(){return []}};
  const context=vm.createContext({document,fetch:()=>new Promise(()=>{}),setTimeout(){},alert(){},console});
  vm.runInContext(fs.readFileSync(path.join(project,'admin/admin.js'),'utf8'),context);
  vm.runInContext("catalogue={courses:[{id:'a',lessons:[]}]};course=catalogue.courses[0]",context);
  context.mockApi=async(url,data)=>{
    calls.push({url,data});
    if(url.endsWith('/check'))return {token:'test',targets:[{scope:'source',total:1,unused:[{scope:'source',name:'<test>.png',size:123}],missing:['missing.mp4']}]};
    return {moved:[{size:123}],skipped:[],errors:[],backup:'_resource-trash/test'};
  };
  vm.runInContext('api=mockApi',context);
  await vm.runInContext("$('#checkResources').onclick()",context);
  assert(nodes.get('#resourceDialog').open);
  assert.match(nodes.get('#resourceReport').innerHTML,/&lt;test&gt;\.png/);
  assert.match(nodes.get('#resourceReport').innerHTML,/missing\.mp4/);
  assert.equal(nodes.get('#cleanResources').disabled,false);
  await vm.runInContext("$('#cleanResources').onclick()",context);
  assert.equal(nodes.get('#cleanResources').disabled,true);
  assert.equal(calls[1].data.token,'test');assert(calls[1].data.catalogue);
  assert.match(nodes.get('#resourceReport').textContent,/_resource-trash\/test/);
});

test('release includes only used resources and preserves progress and the executable', t => {
  const root=fixture(t);save(root,catalogue('used.png'));
  write(root,'content/assets/used.png','used');write(root,'content/assets/source-orphan.png','orphan');
  save(root,catalogue('old.png'),'release/');write(root,'release/content/assets/old.png','old');
  write(root,'release/data/progress.json','profile progress');write(root,'release/SkillPath.exe','runtime');
  write(root,'learner/index.html','learner');write(root,'server.js','server');
  fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'lib'));
  fs.copyFileSync(path.join(project,'lib/resources.js'),path.join(root,'lib/resources.js'));
  fs.copyFileSync(path.join(project,'scripts/build-release.js'),path.join(root,'scripts/build-release.js'));
  execFileSync(process.execPath,[path.join(root,'scripts/build-release.js')],{stdio:'pipe'});
  assert.deepEqual(fs.readdirSync(path.join(root,'release/content/assets')),['used.png']);
  assert.equal(fs.readFileSync(path.join(root,'release/data/progress.json'),'utf8'),'profile progress');
  assert.equal(fs.readFileSync(path.join(root,'release/SkillPath.exe'),'utf8'),'runtime');
  assert(fs.existsSync(path.join(root,'content/assets/source-orphan.png')));
  assert(fs.readdirSync(path.join(root,'_resource-trash')).length);
});

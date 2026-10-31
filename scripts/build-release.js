const fs = require('fs');
const path = require('path');
const {readCatalogue, collectReferences, checkAssetPath, auditResources, cleanResources} = require('../lib/resources');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'release');
const catalogue = readCatalogue(path.join(root, 'content'));
const source = auditResources(root).find(target => target.scope === 'source');
if (source.missing.length) throw new Error('Не найдены ресурсы курса: ' + source.missing.join(', '));
for (const relative of ['', 'content', 'learner', 'lib', 'data']) {
  const target = path.join(out, relative);
  if (fs.existsSync(target) && fs.lstatSync(target).isSymbolicLink()) throw new Error('Папки релиза не должны быть символическими ссылками');
}
fs.mkdirSync(path.join(out, 'content', 'assets'), {recursive:true});
for (const item of ['learner', 'lib', 'server.js']) fs.cpSync(path.join(root, item), path.join(out, item), {recursive:true});
for (const name of collectReferences(catalogue)) {
  const from = checkAssetPath(path.join(root, 'content', 'assets'), name);
  const to = checkAssetPath(path.join(out, 'content', 'assets'), name);
  fs.mkdirSync(path.dirname(to), {recursive:true});
  fs.copyFileSync(from, to);
}
fs.writeFileSync(path.join(out, 'content', 'courses.json'), JSON.stringify(catalogue, null, 2));
const release = auditResources(root).filter(target => target.scope === 'release');
const cleanup = cleanResources(root, release);
if (cleanup.errors.length) throw new Error('Не удалось убрать лишние ресурсы релиза: ' + cleanup.errors.map(item => item.file).join(', '));
if (cleanup.moved.length) console.log(`Лишние ресурсы релиза (${cleanup.moved.length}) перемещены в ${cleanup.backup}`);
fs.mkdirSync(path.join(out, 'data'), {recursive:true});
fs.writeFileSync(path.join(out, 'start-windows.bat'), '@echo off\r\nif exist SkillPath.exe (SkillPath.exe --mode=learn --root=.) else (node server.js --mode=learn --root=.)\r\n');
fs.writeFileSync(path.join(out, 'start-mac.command'), '#!/bin/bash\ncd "$(dirname "$0")"\nif [ -f ./SkillPath ]; then ./SkillPath --mode=learn --root=.; else node server.js --mode=learn --root=.; fi\n');
console.log('Release создан в папке release. Затем выполните npm run package:win или npm run package:mac, чтобы добавить автономный запуск без Node.js.');

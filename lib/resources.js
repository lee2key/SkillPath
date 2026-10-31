const fs = require('fs');
const path = require('path');
const resourceKey = name => process.platform === 'win32' ? name.toLowerCase() : name;

function readCatalogue(contentDir) {
  const file = ['courses.json', 'course.json'].map(name => path.join(contentDir, name)).find(file => fs.existsSync(file));
  if (!file) throw new Error(`Не найден каталог курсов: ${contentDir}`);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  const catalogue = value.courses ? value : {courses:[value]};
  if (!Array.isArray(catalogue.courses) || !catalogue.courses.length || catalogue.courses.some(course => !course || !Array.isArray(course.lessons))) throw new Error('Некорректный каталог курсов');
  return catalogue;
}

function collectReferences(value, refs = new Set()) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(/\/content\/assets\/([^\s<>"']+)/g)) {
      let name;
      try { name = decodeURIComponent(match[1].split(/[?#]/)[0].replace(/[),.;!]+$/, '')); } catch { continue; }
      if (!name || name.includes('\\') || name.split('/').some(part => part === '..' || part === '.' || !part)) continue;
      refs.add(name);
    }
  } else if (Array.isArray(value)) value.forEach(item => collectReferences(item, refs));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => collectReferences(item, refs));
  return refs;
}

function checkAssetPath(assetDir, relative) {
  const parts = relative.split('/');
  if (path.isAbsolute(relative) || parts.some(part => !part || part === '..' || part === '.') || relative.includes('\\')) throw new Error('Некорректный путь ресурса');
  let current = assetDir;
  for (const part of ['', ...parts]) {
    if (part) current = path.join(current, part);
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('Ссылки на другие папки не очищаются');
  }
  return current;
}

function scanTarget(root, scope, draft) {
  const contentDir = path.join(root, scope === 'release' ? 'release/content' : 'content');
  let directory = root;
  for (const part of (scope === 'release' ? ['release','content','assets'] : ['content','assets'])) {
    directory = path.join(directory, part);
    if (fs.existsSync(directory) && fs.lstatSync(directory).isSymbolicLink()) throw new Error('Папки ресурсов не должны быть символическими ссылками');
  }
  if (!fs.existsSync(contentDir)) return null;
  const refs = collectReferences(readCatalogue(contentDir));
  // Unsaved additions must also protect files; unsaved removals do not erase saved resources.
  if (scope === 'source' && draft) collectReferences(draft, refs);
  const assetDir = path.join(contentDir, 'assets');
  const files = [];
  function walk(directory, prefix = '') {
    if (!fs.existsSync(directory)) return;
    if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Папка ресурсов не должна быть символической ссылкой');
    for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) walk(path.join(directory, entry.name), relative + '/');
      else if (entry.isFile()) {
        const stat = fs.statSync(checkAssetPath(assetDir, relative));
        files.push({scope, name:relative, size:stat.size, modified:stat.mtimeMs});
      }
    }
  }
  walk(assetDir);
  const found = new Set(files.map(file => resourceKey(file.name)));
  const used = new Set([...refs].map(resourceKey));
  return {scope, total:files.length, unused:files.filter(file => !used.has(resourceKey(file.name))), missing:[...refs].filter(name => !found.has(resourceKey(name)))};
}

function auditResources(root, draft) {
  return ['source', 'release'].map(scope => scanTarget(root, scope, draft)).filter(Boolean);
}

function cleanResources(root, snapshot, draft) {
  const current = auditResources(root, draft);
  const eligible = new Map(current.flatMap(target => target.unused).map(file => [file.scope + '/' + file.name, file]));
  const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + require('crypto').randomBytes(4).toString('hex');
  const backupDir = path.join(root, '_resource-trash', stamp);
  const trashRoot = path.join(root, '_resource-trash');
  if (fs.existsSync(trashRoot) && fs.lstatSync(trashRoot).isSymbolicLink()) throw new Error('Резервная папка не должна быть символической ссылкой');
  const moved = [];
  const skipped = [];
  const errors = [];
  for (const candidate of snapshot.flatMap(target => target.unused)) {
    const key = candidate.scope + '/' + candidate.name;
    const file = eligible.get(key);
    if (!file || file.size !== candidate.size || file.modified !== candidate.modified) { skipped.push(key); continue; }
    const assetDir = path.join(root, candidate.scope === 'release' ? 'release/content/assets' : 'content/assets');
    const source = checkAssetPath(assetDir, candidate.name);
    const destination = path.join(backupDir, key);
    try {
      fs.mkdirSync(path.dirname(destination), {recursive:true});
      fs.renameSync(source, destination);
      moved.push({scope:candidate.scope, name:candidate.name, size:candidate.size});
    } catch (error) { errors.push({file:key, error:error.code || error.message}); }
  }
  return {moved, skipped, errors, backup:moved.length ? path.relative(root, backupDir).split(path.sep).join('/') : null};
}

module.exports = {readCatalogue, collectReferences, checkAssetPath, scanTarget, auditResources, cleanResources};

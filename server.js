const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { auditResources, cleanResources } = require('./lib/resources');
const resourceChecks = new Map();

const args = Object.fromEntries(process.argv.slice(2).map(x => { const [k, v] = x.replace(/^--/, '').split('='); return [k, v || true]; }));
const mode = args.mode || 'admin';
const root = path.resolve(args.root || '.');
const publicDir = mode === 'admin' ? path.join(root, 'admin') : path.join(root, 'learner');
const contentDir = path.join(root, 'content');
const progressFile = path.join(root, 'data', 'progress.json');
const coursesFile = path.join(contentDir, 'courses.json');
const mime = { '.html':'text/html; charset=utf-8', '.js':'application/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.mp4':'video/mp4', '.svg':'image/svg+xml' };

function json(res, status, value) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); }
function ensure(file, fallback) { fs.mkdirSync(path.dirname(file), { recursive:true }); if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(fallback, null, 2)); }
function read(file, fallback) { ensure(file, fallback); return JSON.parse(fs.readFileSync(file, 'utf8')); }
function body(req) { return new Promise((resolve, reject) => { let data=''; req.on('data', c => data += c); req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch(e) { reject(e); } }); }); }
function safe(base, requested) { const output = path.resolve(base, requested); return output.startsWith(base) ? output : null; }
function freshCourse() { return { id:`course-${Date.now()}`, title:'Новый курс', description:'', lessons:[] }; }
function readCourses() {
  if (fs.existsSync(coursesFile)) return read(coursesFile, {courses:[freshCourse()]});
  const legacy = read(path.join(contentDir, 'course.json'), freshCourse());
  if (!legacy.id) legacy.id = `course-${Date.now()}`;
  const catalogue = {courses:[legacy]};
  fs.mkdirSync(contentDir, {recursive:true}); fs.writeFileSync(coursesFile, JSON.stringify(catalogue, null, 2));
  return catalogue;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/build-release') {
      if (mode !== 'admin') return json(res, 403, {error:'Сборка доступна только в редакторе'});
      if (req.method !== 'POST') return json(res, 405, {error:'Нужен POST-запрос'});
      if (process.platform !== 'win32') return json(res, 400, {error:'Запуск BAT доступен только в Windows'});
      if (!fs.existsSync(path.join(root, 'build-release.bat'))) return json(res, 400, {error:'Не найден build-release.bat в папке проекта'});
      await body(req);
      await new Promise((resolve, reject) => {
        const child = require('child_process').spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'build-release.bat'], {cwd:root, detached:true, windowsHide:false, stdio:'ignore'});
        child.once('error', reject);
        child.once('spawn', () => { child.unref(); resolve(); });
      });
      return json(res, 200, {ok:true});
    }
    if (url.pathname === '/api/resources/check' || url.pathname === '/api/resources/clean') {
      if (mode !== 'admin') return json(res, 403, {error:'Очистка доступна только в редакторе'});
      if (req.method !== 'POST') return json(res, 405, {error:'Нужен POST-запрос'});
      const request = await body(req);
      if (url.pathname.endsWith('/check')) {
        const targets = auditResources(root, request.catalogue);
        const token = require('crypto').randomBytes(24).toString('hex');
        resourceChecks.clear();
        resourceChecks.set(token, {targets, expires:Date.now() + 15 * 60 * 1000});
        return json(res, 200, {token, targets});
      }
      const check = resourceChecks.get(request.token);
      if (!check || check.expires < Date.now()) return json(res, 409, {error:'Сначала запустите проверку файлов ещё раз'});
      const result = cleanResources(root, check.targets, request.catalogue);
      resourceChecks.delete(request.token);
      return json(res, 200, result);
    }
    if (url.pathname === '/api/courses') {
      if (req.method === 'GET') return json(res, 200, readCourses());
      if (mode !== 'admin') return json(res, 403, {error:'Редактирование недоступно'});
      const catalogue = await body(req);
      if (!Array.isArray(catalogue.courses) || !catalogue.courses.length) return json(res, 400, {error:'Нужен хотя бы один курс'});
      fs.mkdirSync(contentDir, {recursive:true}); fs.writeFileSync(coursesFile, JSON.stringify(catalogue, null, 2));
      return json(res, 200, {ok:true});
    }
    if (url.pathname === '/api/course') {
      const file = path.join(contentDir, 'course.json');
      if (req.method === 'GET') return json(res, 200, read(file, { title:'Новый курс', lessons:[] }));
      if (mode !== 'admin') return json(res, 403, {error:'Редактирование недоступно'});
      const course = await body(req); fs.mkdirSync(contentDir, {recursive:true}); fs.writeFileSync(file, JSON.stringify(course, null, 2)); return json(res, 200, {ok:true});
    }
    if (url.pathname === '/api/progress') {
      if (req.method === 'GET') return json(res, 200, read(progressFile, { profiles:{} }));
      const data = await body(req); fs.mkdirSync(path.dirname(progressFile), {recursive:true}); fs.writeFileSync(progressFile, JSON.stringify(data, null, 2)); return json(res, 200, {ok:true});
    }
    if (url.pathname === '/api/upload' && req.method === 'POST') {
      if (mode !== 'admin') return json(res, 403, {error:'Недоступно'});
      const { name, data } = await body(req);
      const clean = path.basename(name || 'asset');
      const match = /^data:.*?;base64,(.*)$/.exec(data || '');
      if (!match) return json(res, 400, {error:'Некорректный файл'});
      const assetDir = path.join(contentDir, 'assets'); fs.mkdirSync(assetDir, {recursive:true});
      const fileName = `${Date.now()}-${clean.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      fs.writeFileSync(path.join(assetDir, fileName), Buffer.from(match[1], 'base64'));
      return json(res, 200, {path:`/content/assets/${fileName}`});
    }
    const assetBase = url.pathname.startsWith('/content/') ? root : publicDir;
    const relative = url.pathname.startsWith('/content/') ? url.pathname.slice(1) : (url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
    const file = safe(assetBase, relative);
    if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Не найдено'); }
    res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream'}); fs.createReadStream(file).pipe(res);
  } catch (error) { console.error(error); json(res, 500, {error:'Ошибка приложения'}); }
});
function start(port) {
  server.once('error', error => {
    if (error.code === 'EADDRINUSE') {
      console.error(`SkillPath уже запущен или порт ${port} занят. Закройте существующее окно/процесс и попробуйте снова.`);
      process.exitCode = 1;
      return;
    }
    console.error('Не удалось запустить локальный сервер:', error.message);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`;
  console.log(`${mode === 'admin' ? 'Редактор' : 'Обучение'}: ${url}`);
  const open = process.platform === 'win32' ? `start \"\" ${url}` : process.platform === 'darwin' ? `open ${url}` : `xdg-open ${url}`;
  require('child_process').exec(open);
  });
}
start(Number(args.port || (mode === 'admin' ? 3210 : 3220)));

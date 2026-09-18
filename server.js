const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], orders: [], sessions: [] }, null, 2));
}

function readStore() { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeStore(store) { fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2)); }
function id() { return crypto.randomUUID(); }
function safeUser(user) {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => {
    if (error) reject(error); else resolve(`${salt}:${key.toString('hex')}`);
  }));
}
async function verifyPassword(password, value) {
  const [salt, hash] = value.split(':');
  const candidate = await hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(candidate.split(':')[1], 'hex'), Buffer.from(hash, 'hex'));
}
function parseCookies(request) {
  return Object.fromEntries((request.headers.cookie || '').split(';').filter(Boolean).map((item) => {
    const index = item.indexOf('='); return [item.slice(0, index).trim(), decodeURIComponent(item.slice(index + 1))];
  }));
}
function currentUser(request, store) {
  const token = parseCookies(request).session;
  const session = store.sessions.find((entry) => entry.token === token && entry.expiresAt > Date.now());
  return session ? store.users.find((user) => user.id === session.userId) : null;
}
function json(response, status, body, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
  response.end(JSON.stringify(body));
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => { body += chunk; if (body.length > 100000) request.destroy(); });
    request.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('Neplatný požadavek.')); } });
  });
}
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (!email || !password) return;
  const store = readStore();
  if (store.users.some((user) => user.email === email)) return;
  store.users.push({ id: id(), email, passwordHash: await hashPassword(password), role: 'admin', createdAt: new Date().toISOString() });
  writeStore(store);
  console.log(`Admin účet vytvořen pro ${email}`);
}

async function api(request, response, pathname) {
  const store = readStore();
  const user = currentUser(request, store);
  if (pathname === '/api/register' && request.method === 'POST') {
    const { email = '', password = '' } = await readBody(request);
    const normalizedEmail = email.trim().toLowerCase();
    if (!validEmail(normalizedEmail) || password.length < 8) return json(response, 400, { error: 'Zadejte platný e-mail a heslo alespoň o 8 znacích.' });
    if (store.users.some((entry) => entry.email === normalizedEmail)) return json(response, 409, { error: 'Účet s tímto e-mailem už existuje.' });
    const newUser = { id: id(), email: normalizedEmail, passwordHash: await hashPassword(password), role: 'customer', createdAt: new Date().toISOString() };
    store.users.push(newUser); writeStore(store);
    return json(response, 201, { message: 'Účet byl vytvořen. Nyní se můžete přihlásit.' });
  }
  if (pathname === '/api/login' && request.method === 'POST') {
    const { email = '', password = '' } = await readBody(request);
    const account = store.users.find((entry) => entry.email === email.trim().toLowerCase());
    if (!account || !(await verifyPassword(password, account.passwordHash))) return json(response, 401, { error: 'Nesprávný e-mail nebo heslo.' });
    const token = crypto.randomBytes(32).toString('hex');
    store.sessions = store.sessions.filter((entry) => entry.expiresAt > Date.now());
    store.sessions.push({ token, userId: account.id, expiresAt: Date.now() + SESSION_TTL_MS }); writeStore(store);
    return json(response, 200, { user: safeUser(account) }, { 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_MS / 1000}` });
  }
  if (pathname === '/api/logout' && request.method === 'POST') {
    store.sessions = store.sessions.filter((entry) => entry.token !== parseCookies(request).session); writeStore(store);
    return json(response, 200, { message: 'Odhlášeno.' }, { 'Set-Cookie': 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0' });
  }
  if (pathname === '/api/me' && request.method === 'GET') return user ? json(response, 200, { user: safeUser(user) }) : json(response, 401, { error: 'Nepřihlášeno.' });
  if (pathname === '/api/orders' && request.method === 'POST') {
    if (!user) return json(response, 401, { error: 'Pro objednávku se nejdřív přihlaste.' });
    const { service = '', details = '' } = await readBody(request);
    const allowed = ['Minecraft skripty & konfigurace', 'Webové stránky', 'Discord server na míru'];
    if (!allowed.includes(service) || details.trim().length < 10) return json(response, 400, { error: 'Vyberte službu a popište objednávku alespoň v 10 znacích.' });
    const order = { id: id(), userId: user.id, service, details: details.trim(), status: 'Nová', createdAt: new Date().toISOString() };
    store.orders.unshift(order); writeStore(store); return json(response, 201, { order });
  }
  if (pathname === '/api/orders' && request.method === 'GET') {
    if (!user) return json(response, 401, { error: 'Nepřihlášeno.' });
    const orders = user.role === 'admin' ? store.orders.map((order) => ({ ...order, customer: safeUser(store.users.find((entry) => entry.id === order.userId)) })) : store.orders.filter((order) => order.userId === user.id);
    return json(response, 200, { orders });
  }
  const orderMatch = pathname.match(/^\/api\/orders\/([^/]+)$/);
  if (orderMatch && request.method === 'DELETE') {
    if (!user) return json(response, 401, { error: 'Nepřihlášeno.' });
    const orderIndex = store.orders.findIndex((order) => order.id === orderMatch[1]);
    if (orderIndex === -1) return json(response, 404, { error: 'Objednávka nebyla nalezena.' });
    if (user.role !== 'admin' && store.orders[orderIndex].userId !== user.id) return json(response, 403, { error: 'Tuto objednávku nemůžete odstranit.' });
    store.orders.splice(orderIndex, 1); writeStore(store);
    return json(response, 200, { message: 'Objednávka byla odstraněna.' });
  }
  if (pathname === '/api/admin/users' && request.method === 'GET') {
    if (!user || user.role !== 'admin') return json(response, 403, { error: 'Nemáte oprávnění správce.' });
    return json(response, 200, { users: store.users.map(safeUser) });
  }
  const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
  if (userMatch && request.method === 'DELETE') {
    if (!user || user.role !== 'admin') return json(response, 403, { error: 'Nemáte oprávnění správce.' });
    const userIndex = store.users.findIndex((entry) => entry.id === userMatch[1]);
    if (userIndex === -1) return json(response, 404, { error: 'Účet nebyl nalezen.' });
    if (store.users[userIndex].id === user.id) return json(response, 400, { error: 'Nemůžete odstranit právě přihlášený účet.' });
    const deletedUser = store.users[userIndex];
    store.users.splice(userIndex, 1);
    store.orders = store.orders.filter((order) => order.userId !== deletedUser.id);
    store.sessions = store.sessions.filter((session) => session.userId !== deletedUser.id);
    writeStore(store);
    return json(response, 200, { message: 'Účet a jeho objednávky byly odstraněny.' });
  }
  return json(response, 404, { error: 'Nenalezeno.' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
  try {
    if (pathname.startsWith('/api/')) return await api(request, response, pathname);
    const requested = pathname === '/' ? '/index.html' : decodeURIComponent(pathname);
    const file = path.resolve(ROOT, `.${requested}`);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); return response.end('Nenalezeno'); }
    response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(response);
  } catch (error) { json(response, 500, { error: error.message || 'Nastala chyba serveru.' }); }
});

seedAdmin().then(() => server.listen(PORT, () => console.log(`CodeServices běží na http://localhost:${PORT}`)));

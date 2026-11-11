// Walk with Jesus: keeps a copy of the game and its pictures so it works offline
const CACHE = 'wwj-v3';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Safari refuses a page that a helper hands over after a redirect, so copy it into a fresh response
const clean = r => r.redirected ? r.blob().then(b => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers })) : r;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    // the page: always try the internet first so updates arrive, use the saved copy only when offline
    e.respondWith(fetch(req).then(clean).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put('./', r.clone())); return r; })
      .catch(() => caches.match('./').then(h => h || Response.error())));
    return;
  }
  if (new URL(req.url).origin !== location.origin) return;   // fonts etc: let the browser handle them
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req);
    if (hit) return hit;
    const r = await fetch(req);
    if (r.ok) c.put(req, r.clone());
    return r;
  }));
});

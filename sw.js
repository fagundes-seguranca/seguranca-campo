/* Service worker – Segurança em Campo · Fagundes
   A página fica guardada no aparelho (abre na hora, mesmo sem internet).
   Versão nova só entra quando a pessoa toca em "Atualizar" ou fecha e abre o app. */
const CACHE = 'fag-seguranca-v4.1.0';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-branco.png', './logo-azul.png', './simbolo-branco.png', './simbolo-azul.png', './login.jpg', './modelo_colaboradores.xlsx', './modelo_areas_frentes.xlsx'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS.map(a => new Request(a, { cache: 'reload' })))));
});
self.addEventListener('message', e => { if (e.data && e.data.tipo === 'ATUALIZAR') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // servidor (Apps Script) nunca passa pelo cache
  if (u.pathname.endsWith('versao.json')) return;                        // sempre direto da internet
  const pagina = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
  if (pagina && !u.searchParams.has('t')) {
    e.respondWith(caches.open(CACHE).then(c => c.match('./index.html')).then(g => g || fetch(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(cache => {
    const rede = fetch(e.request).then(r => {
      if (r && r.ok && !u.searchParams.has('t')) { const cl = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cl)); }
      return r;
    }).catch(() => cache);
    return u.searchParams.has('t') ? rede : (cache || rede);
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tela = (e.notification.data && e.notification.data.tela) || 'avisos';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { c.postMessage({ tela }); return c.focus(); }
    return self.clients.openWindow('./');
  }));
});

/* Web-only offline shell. Versioned caches never contain or mutate player saves. */
const VERSION = __VERSION__;
const CORE_URLS = __CORE__;
const CORE = `som-web-core-${VERSION}`;
const MEDIA = `som-web-media-${VERSION}`;
const MEDIA_LIMIT = 60_000_000;
const ENTRY_LIMIT = 120;
let writing = Promise.resolve();
self.addEventListener('install', event => event.waitUntil((async () => {
  try { await (await caches.open(CORE)).addAll(CORE_URLS); }
  catch (cause) { await caches.delete(CORE); throw cause; }
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  // Retain a previous version for other open tabs; only remove our own older caches.
  const keys = await caches.keys();
  for (const prefix of ['som-web-core-', 'som-web-media-']) {
    const previous = keys.filter(key => key.startsWith(prefix) && key !== prefix + VERSION);
    await Promise.all(previous.slice(0, -1).map(key => caches.delete(key)));
  }
  // Retired ultimate movies are safe to evict, including the retained media
  // version. Cache Storage never contains player progress or collections.
  for (const key of (await caches.keys()).filter(key => key.startsWith('som-web-media-'))) {
    const cache = await caches.open(key);
    for (const request of await cache.keys()) if (new URL(request.url).pathname.endsWith('.mp4')) await cache.delete(request);
  }
  await self.clients.claim();
})()));
self.addEventListener('message', event => {
  if (event.data?.type === 'WEB_VERSION') event.ports?.[0]?.postMessage(VERSION);
  if (event.data?.type === 'WEB_CACHE_STATUS') event.waitUntil((async () => {
    const cache = await caches.open(MEDIA), keys = await cache.keys();
    let bytes = 0;
    for (const key of keys) bytes += Number((await cache.match(key))?.headers.get('X-SOM-Bytes') || 0);
    const previousCaches = (await caches.keys()).filter(name => /^som-web-(?:core|media)-/.test(name) && name !== CORE && name !== MEDIA).length;
    event.ports?.[0]?.postMessage({version: VERSION, entries: keys.length, bytes, previousCaches});
  })());
  if (event.data?.type === 'APPLY_WEB_UPDATE') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'WARM_WEB_ASSETS' && Array.isArray(event.data.urls)) event.waitUntil(Promise.all(event.data.urls.slice(0,48).map(async value => {
    try {
      const url = new URL(value, self.location.origin);
      if(url.origin !== self.location.origin || !url.pathname.startsWith('/assets/') || !/\.(webp|png|jpg|mp3|wav|js|css)$/.test(url.pathname)) return;
      const request = new Request(url.href, {credentials:'same-origin'});
      const cache = await caches.open(MEDIA);
      if(!await cache.match(request)) await putMedia(request, await fetch(request));
    } catch { /* offline warming is optional */ }
  })));
});
async function trimMedia(cache, incomingBytes = 0, incomingEntries = 0) {
  const keys = await cache.keys();
  let bytes = 0;
  for (const key of keys) bytes += Number((await cache.match(key))?.headers.get('X-SOM-Bytes') || 0);
  while (keys.length && (keys.length + incomingEntries > ENTRY_LIMIT || bytes + incomingBytes > MEDIA_LIMIT)) {
    const key = keys.shift();
    if (!key) break;
    bytes -= Number((await cache.match(key))?.headers.get('X-SOM-Bytes') || 0);
    await cache.delete(key);
  }
}
function putMedia(request, response) {
  if (new URL(request.url).pathname.endsWith('.mp4')) return Promise.resolve();
  // Serialize LRU writes; partial streams and oversized files never fill the cache.
  writing = writing.catch(() => {}).then(async () => {
    if (!response.ok || response.status !== 200) return;
    const body = await response.blob();
    if (body.size > 8_000_000) return;
    const headers = new Headers(response.headers);
    headers.set('X-SOM-Bytes', String(body.size));
    const cache = await caches.open(MEDIA);
    await cache.delete(request);
    await trimMedia(cache, body.size, 1);
    const stored = new Response(body, {status: 200, headers});
    try { await cache.put(request, stored.clone()); }
    catch {
      // A browser may report quota pressure between estimate and write. Evict
      // one additional oldest entry and retry once; gameplay still uses the
      // network response if the optional cache write cannot be completed.
      const oldest = (await cache.keys())[0];
      if (oldest) await cache.delete(oldest);
      try { await cache.put(request, stored); } catch { /* optional cache */ }
    }
  });
  return writing;
}
async function ranged(response, range) {
  const bytes = await response.arrayBuffer();
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match || (!match[1] && !match[2])) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${bytes.byteLength}`}});
  const start = match[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
  if (start > end || start >= bytes.byteLength) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${bytes.byteLength}`}});
  const headers = new Headers(response.headers);
  headers.set('Content-Range', `bytes ${start}-${end}/${bytes.byteLength}`);
  headers.set('Content-Length', String(end - start + 1));
  headers.set('Accept-Ranges', 'bytes');
  return new Response(bytes.slice(start, end + 1), {status: 206, headers});
}
async function shellFromCurrentOrPrevious() {
  const current = await (await caches.open(CORE)).match('/index.html');
  if (current) return current;
  const previous = (await caches.keys()).filter(key => key.startsWith('som-web-core-') && key !== CORE).reverse();
  for (const key of previous) {
    const shell = await (await caches.open(key)).match('/index.html');
    if (shell) return shell;
  }
}
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;
  if (request.mode === 'navigate') {
    // Pin the document to this worker's shell so a deploy cannot mix JS versions.
    event.respondWith((async () => (await shellFromCurrentOrPrevious()) || fetch(request))());
    return;
  }
  if (!url.pathname.startsWith('/assets/') && !CORE_URLS.includes(url.pathname)) return;
  event.respondWith((async () => {
    // These version-pinned static files are identical for every same-origin
    // request. Preview/CDN Vary: Origin must not hide an installed module when
    // <script crossorigin> adds an Origin header that precache did not send.
    const core = await caches.open(CORE), coreHit = await core.match(request, {ignoreVary: true});
    if (coreHit) return coreHit;
    // An already open tab may still request a hashed chunk from the previous build.
    for (const key of (await caches.keys()).filter(key => key.startsWith('som-web-core-') && key !== CORE)) {
      const previous = await (await caches.open(key)).match(request, {ignoreVary: true});
      if (previous) return previous;
    }
    const cache = await caches.open(MEDIA);
    const fullRequest = new Request(url.href, {credentials: 'same-origin'});
    const hit = await cache.match(fullRequest);
    if (hit) {
      event.waitUntil(putMedia(fullRequest, hit.clone()));
      return request.headers.has('Range') ? ranged(hit, request.headers.get('Range')) : hit;
    }
    const response = await fetch(request);
    if (response.status === 200) event.waitUntil(putMedia(fullRequest, response.clone()));
    else if (response.status === 206) event.waitUntil(fetch(fullRequest).then(full => putMedia(fullRequest, full)).catch(() => {}));
    return response;
  })());
});

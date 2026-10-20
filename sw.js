/* =========================================================
   SERVICE WORKER — v38 (com os 5 arquivos faltantes adicionados)
   ========================================================= */

const VERSAO = 'newtech-v38';
const CACHE_ESTATICO = `${VERSAO}-estatico`;
const CACHE_DINAMICO = `${VERSAO}-dinamico`;

const ARQUIVOS_ESTATICOS = [
  './',
  './index.html',
  './produto.html',
  './checkout.html',
  './pedido.html',
  './pedidos.html',
  './troca.html',
  './privacidade.html',
  './termos.html',
  './sobre.html',
  './contato.html',
  './404.html',
  './offline.html',
  './iphone-18-pro-max.html',
  './iphone-17-pro-max.html',
  './iphone-17.html',
  './iphone-16.html',
  './iphone-15.html',
  './iphone-14.html',
  './iphone-se.html',
  './manifest.json',
  './sitemap.xml',
  './robots.txt',
  './css/base.css', './css/tema.css', './css/nav.css', './css/hero.css',
  './css/iphone.css', './css/produtos.css', './css/modal.css', './css/carrinho.css',
  './css/pagina-produto.css', './css/checkout.css', './css/reviews.css', './css/extras.css',
  './css/home-extras.css', './css/produto-extras.css', './css/produto-img.css', './css/cookies.css',
  './css/legal.css', './css/carrinho-abandonado.css', './css/busca-voz.css', './css/sticky-add-cart.css',
  './css/print.css', './css/landing.css', './css/paginas.css', './css/faq-busca.css',
  './css/exportar-csv.css', './css/compacto.css', './css/sem-overflow.css', './css/grid-produtos.css',
  './css/comparador-rico.css', './css/qrcode.css', './css/responsivo.css', './css/acessibilidade.css',
  './js/dados.js', './js/analytics.js', './js/error-boundary.js', './js/focus-trap.js',
  './js/seo.js', './js/cookies-lgpd.js', './js/ui.js', './js/tema-auto.js',
  './js/pwa.js', './js/extras.js', './js/comparador.js', './js/carrinho-ui.js',
  './js/home.js', './js/produto.js', './js/checkout.js', './js/pedido.js',
  './js/pedidos.js', './js/carrinho-abandonado.js', './js/busca-voz.js', './js/landing.js',
  './js/faq-busca.js', './js/contato.js', './js/exportar-csv.js', './js/qrcode.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_ESTATICO).then((cache) =>
      Promise.allSettled(ARQUIVOS_ESTATICOS.map(url => cache.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => !n.startsWith(VERSAO)).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE_DINAMICO).then((c) => c.put(req, copia));
        return resp;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./offline.html')))
    );
    return;
  }

  if (url.pathname.match(/\.(css|js|svg|woff2|png|webp|jpg|jpeg)$/)) {
    e.respondWith(
      caches.open(CACHE_ESTATICO).then(async (cache) => {
        const cacheado = await cache.match(req);
        const rede = fetch(req).then((resp) => {
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        }).catch(() => null);
        return cacheado || (await rede) || new Response('', { status: 504 });
      })
    );
    return;
  }
  e.respondWith(caches.match(req).then((c) => c || fetch(req)));
});
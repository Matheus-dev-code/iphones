/* =========================================================
   ANALYTICS — wrapper leve pra Plausible / Umami / GA4
   ---------------------------------------------------------
   Se nenhuma ferramenta estiver carregada, só loga no console.
   Nunca quebra o site.
   ========================================================= */

const DEBUG_ANALYTICS = location.hostname === 'localhost';

/**
 * Envia um evento de analytics.
 * @param {string} nome - ex: 'add_to_cart', 'begin_checkout'
 * @param {object} props - propriedades adicionais
 */
function track(nome, props = {}) {
  if (DEBUG_ANALYTICS) {
    console.log('[analytics]', nome, props);
  }

  // Plausible
  if (typeof window.plausible === 'function') {
    window.plausible(nome, { props });
    return;
  }

  // Umami
  if (typeof window.umami === 'function') {
    window.umami.track(nome, props);
    return;
  }

  // GA4
  if (typeof window.gtag === 'function') {
    window.gtag('event', nome, props);
  }
}

/* =========================================================
   EVENTOS DE ECOMMERCE (padrão GA4)
   ========================================================= */
function trackViewItem(produto) {
  track('view_item', {
    item_id: produto.id,
    item_name: produto.nome,
    price: produto.base,
    currency: 'BRL'
  });
}

function trackAddToCart(produto, quantidade = 1, valor) {
  track('add_to_cart', {
    item_id: produto.id,
    item_name: produto.nome,
    quantity: quantidade,
    value: valor,
    currency: 'BRL'
  });
}

function trackBeginCheckout(carrinho, total) {
  track('begin_checkout', {
    items: carrinho.length,
    value: total,
    currency: 'BRL'
  });
}

function trackPurchase(pedido) {
  track('purchase', {
    transaction_id: pedido.numero,
    value: pedido.total,
    currency: 'BRL',
    payment_method: pedido.pagamento
  });
}

function trackCupomAplicado(codigo, desconto) {
  track('coupon_applied', {
    coupon: codigo,
    value: desconto,
    currency: 'BRL'
  });
}

function trackBusca(termo, resultados) {
  track('search', { term: termo, results: resultados });
}
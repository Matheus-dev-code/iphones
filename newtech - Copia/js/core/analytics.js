/* =========================================================
   ANALYTICS — wrapper leve pra Plausible / Umami / GA4
   ========================================================= */

const DEBUG_ANALYTICS = location.hostname === 'localhost';

function track(nome, props = {}) {
  if (DEBUG_ANALYTICS) {
    console.log('[analytics]', nome, props);
  }

  if (typeof window.plausible === 'function') {
    window.plausible(nome, { props });
    return;
  }

  if (typeof window.umami === 'function') {
    window.umami.track(nome, props);
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', nome, props);
  }
}

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
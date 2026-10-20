/* =========================================================
   PÁGINA DE PEDIDOS — histórico
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
const listaEl = $('#listaPedidos');

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function renderLista() {
  const pedidos = lerPedidos();

  if (!pedidos.length) {
    listaEl.innerHTML = `
      <div class="pedidos-vazio">
        <div class="icone">📦</div>
        <h2>Nenhum pedido ainda</h2>
        <p>Quando você fizer sua primeira compra, ela vai aparecer aqui.</p>
        <a href="index.html#produtos" class="btn-primario">Ver iPhones</a>
      </div>
    `;
    return;
  }

  listaEl.innerHTML = pedidos.map((p) => {
    const miniaturas = p.itens.slice(0, 3).map((item) => `
      <div class="pedido-mini" style="--c:${escapeHTML(item.corHex)}"></div>
    `).join('');

    const restantes = p.itens.length - 3;
    const mais = restantes > 0 ? `<div class="pedido-mini mais">+${restantes}</div>` : '';
    const qtdTotal = p.itens.reduce((s, i) => s + i.qtd, 0);

    const status = p.status || 'pendente';
    let statusClass = 'status-pendente';
    let statusTexto = 'Pendente';

    if (status === 'enviado') { statusClass = 'status-enviado'; statusTexto = 'Saiu para entrega'; }
    if (status === 'entregue') { statusClass = 'status-entregue'; statusTexto = 'Entregue'; }
    if (status === 'cancelado') { statusClass = 'status-cancelado'; statusTexto = 'Cancelado'; }

    return `
      <article class="pedido-item" data-numero="${escapeHTML(p.numero)}" role="button" tabindex="0">
        <div class="pedido-item-topo">
          <span class="pedido-numero">${escapeHTML(p.numero)}</span>
          <span class="pedido-status ${statusClass}">${statusTexto}</span>
        </div>

        <div class="pedido-item-meio">
          <div class="pedido-miniaturas">
            ${miniaturas}${mais}
          </div>
          <span class="pedido-qtd">
            ${qtdTotal} ${qtdTotal === 1 ? 'item' : 'itens'} · ${formatarData(p.data)}
          </span>
        </div>

        <div class="pedido-item-fim">
          <span>Total</span>
          <strong>${fmt(p.total)}</strong>
        </div>
      </article>
    `;
  }).join('');
}

listaEl.addEventListener('click', (e) => {
  const card = e.target.closest('.pedido-item');
  if (!card) return;
  const numero = card.dataset.numero;
  if (numero) window.location.href = `pedido.html?numero=${encodeURIComponent(numero)}`;
});

listaEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.pedido-item');
  if (!card) return;
  e.preventDefault();
  const numero = card.dataset.numero;
  if (numero) window.location.href = `pedido.html?numero=${encodeURIComponent(numero)}`;
});

renderLista();
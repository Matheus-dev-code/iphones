/* =========================================================
   PÁGINA DE PEDIDO CONFIRMADO — pagamento só na entrega
   ========================================================= */

const $ = (sel) => document.querySelector(sel);
const paramsPedido = new URLSearchParams(window.location.search);
const numeroPedido = paramsPedido.get('numero');
const pedido = numeroPedido ? acharPedido(numeroPedido) : ultimoPedido();
const container = $('#pedido');

if (!pedido) window.location.replace('index.html');

function formatarData(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function renderPedido() {
  document.title = `Pedido ${pedido.numero} — NewTech`;

  const itensHTML = pedido.itens.map((item) => `
    <div class="resumo-item">
      <div class="item-mini" style="--c:${escapeHTML(item.corHex || '#333')}"></div>
      <div class="resumo-item-info">
        <strong>${escapeHTML(item.nome)}${item.qtd > 1 ? ` ×${item.qtd}` : ''}</strong>
        <span>${escapeHTML(item.cor)} · ${escapeHTML(item.cap)}</span>
      </div>
      <div class="resumo-item-preco">${fmt(item.preco * item.qtd)}</div>
    </div>
  `).join('');

  const c = pedido.cliente;
  const enderecoCompleto = [
    `${escapeHTML(c.endereco)}, ${escapeHTML(c.numero)}`,
    c.complemento ? escapeHTML(c.complemento) : '',
    escapeHTML(c.bairro),
    `${escapeHTML(c.cidade)} - ${escapeHTML(c.estado)}`,
    `CEP ${escapeHTML(c.cep)}`
  ].filter(Boolean).join('<br>');

  const freteHTML = pedido.frete
    ? `${escapeHTML(pedido.frete.regiao)} · até ${escapeHTML(pedido.frete.prazo)} dias úteis ${pedido.frete.valor === 0 ? '(grátis)' : `— ${fmt(pedido.frete.valor)}`}`
    : 'Não calculado';

  const descontoTotal = pedido.descontoCupom || 0;
  const descontoTroca = pedido.troca ? pedido.troca.valor : 0;

  const apelidoCliente = escapeHTML(String(c.email || '').split('@')[0] || 'cliente');

  container.innerHTML = `
    <div class="pedido-sucesso">
      <div class="pedido-icone">✓</div>
      <h1>Pedido confirmado!</h1>
      <p>Obrigado, ${apelidoCliente}. Enviamos os detalhes por e-mail.</p>
      <span class="pedido-numero">${escapeHTML(pedido.numero)}</span>
    </div>

    <div class="pedido-cartao">
      <h2>Itens do pedido</h2>
      <div class="resumo-itens">${itensHTML}</div>

      <div class="resumo-valores" style="margin-top: 18px;">
        <div class="resumo-linha">
          <span>Subtotal</span>
          <span>${fmt(pedido.subtotal || 0)}</span>
        </div>
        ${descontoTotal > 0 ? `
          <div class="resumo-linha resumo-desconto">
            <span>Desconto${pedido.cupom ? ` (${escapeHTML(pedido.cupom.codigo)})` : ''}</span>
            <span>− ${fmt(descontoTotal)}</span>
          </div>
        ` : ''}

        ${descontoTroca > 0 ? `
          <div class="resumo-linha resumo-desconto" style="color:#30d158;">
            <span>Entrada do iPhone ${escapeHTML(pedido.troca.modelo)}</span>
            <span>− ${fmt(descontoTroca)}</span>
          </div>
        ` : ''}

        ${pedido.frete ? `
          <div class="resumo-linha">
            <span>Frete</span>
            <span>${pedido.frete.valor === 0 ? 'Grátis' : fmt(pedido.frete.valor || 0)}</span>
          </div>
        ` : ''}
        <div class="resumo-linha resumo-total">
          <span>Total a pagar na entrega</span>
          <strong>${fmt(pedido.total || 0)}</strong>
        </div>
      </div>
    </div>

    <div class="pedido-cartao">
      <h2>Entrega</h2>
      <div class="pedido-info-linha"><span>Destinatário</span><span>${escapeHTML(c.email)}</span></div>
      <div class="pedido-info-linha"><span>Endereço</span><span style="text-align: right;">${enderecoCompleto}</span></div>
      <div class="pedido-info-linha"><span>Frete</span><span>${freteHTML}</span></div>
    </div>

    ${pedido.troca ? `
      <div class="pedido-cartao">
        <h2>Troca de Aparelho</h2>
        <div class="pedido-info-linha">
          <span>Aparelho Entregue</span>
          <span>iPhone ${escapeHTML(pedido.troca.modelo)} (${escapeHTML(pedido.troca.detalhes.armazenamento)})</span>
        </div>
        <div class="pedido-info-linha">
          <span>Estado Declarado</span>
          <span>${escapeHTML(pedido.troca.detalhes.tela)}</span>
        </div>
        <p class="pedido-aviso-pagamento" style="background:rgba(48,209,88,.08); border-color:rgba(48,209,88,.2);">
          O valor de <strong>${fmt(descontoTroca)}</strong> foi abatido do total. O entregador fará a conferência do aparelho no momento da entrega.
        </p>
      </div>
    ` : ''}

    <div class="pedido-cartao">
      <h2>Pagamento</h2>
      <div class="pedido-info-linha"><span>Método</span><span>Pagamento na entrega</span></div>
      <div class="pedido-info-linha"><span>Data</span><span>${escapeHTML(formatarData(pedido.data))}</span></div>
      <p class="pedido-aviso-pagamento">Tenha o valor em mãos — nosso entregador aceita <strong>dinheiro</strong>, <strong>Pix</strong> e <strong>cartão</strong> (débito ou crédito).</p>
    </div>

    <div class="pedido-acoes">
      <a href="index.html" class="btn-primario">Voltar para a loja</a>
      <button class="btn-ghost" onclick="window.print()">Imprimir comprovante</button>
    </div>
  `;
}

renderPedido();
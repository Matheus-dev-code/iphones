/* =========================================================
   CARRINHO UI — drawer compartilhado entre home e produto
   ========================================================= */

function iniciarCarrinhoUI(estado) {
  const carrinhoEl      = document.getElementById('carrinho');
  const backdrop        = document.getElementById('backdrop');
  const listaEl         = document.getElementById('lista');
  const badgeEl         = document.getElementById('badge');
  const subtotalEl      = document.getElementById('subtotal');
  const descontoEl      = document.getElementById('desconto');
  const linhaDescontoEl = document.getElementById('linhaDesconto');

  const linhaTrocaEl    = document.getElementById('linhaTroca');
  const txtTrocaEl      = document.getElementById('txtTroca');
  const valorTrocaEl    = document.getElementById('valorTroca');

  const totalEl         = document.getElementById('total');
  const cupomInput      = document.getElementById('cupomInput');
  const cupomBtn        = document.getElementById('cupomBtn');
  const cupomMsg        = document.getElementById('cupomMsg');

  function renderCarrinho() {
    if (!listaEl) return;

    if (estado.carrinho.length === 0) {
      listaEl.innerHTML = `<p class="vazio">Sua sacola está vazia.</p>`;

      if (typeof lerTroca === 'function' && lerTroca()) {
        gravarTroca(null);
      }
    } else {
      listaEl.innerHTML = estado.carrinho.map((item, i) => `
        <div class="item">
          <div class="item-mini" style="--c:${item.corHex}"></div>
          <div class="item-info">
            <h4>${item.nome}${item.qtd > 1 ? ` <span style="color:var(--muted)">×${item.qtd}</span>` : ''}</h4>
            <p>${item.cor} · ${item.cap}</p>
            <p class="item-preco">${fmt(item.preco * item.qtd)}</p>
          </div>
          <button class="remover" data-i="${i}" aria-label="Remover item">✕</button>
        </div>
      `).join('');
    }

    const subtotal = totalCarrinho(estado.carrinho);
    const desconto = calcularDesconto(estado.cupom, subtotal);

    const troca = typeof lerTroca === 'function' ? lerTroca() : null;
    const descontoTroca = troca ? troca.valor : 0;

    const total = Math.max(0, subtotal - desconto - descontoTroca);

    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (totalEl)    totalEl.textContent    = fmt(total);

    if (desconto > 0 && linhaDescontoEl && descontoEl) {
      linhaDescontoEl.hidden = false;
      descontoEl.textContent = `− ${fmt(desconto)}`;
    } else if (linhaDescontoEl) {
      linhaDescontoEl.hidden = true;
    }

    if (descontoTroca > 0 && linhaTrocaEl && txtTrocaEl && valorTrocaEl) {
      linhaTrocaEl.hidden = false;
      linhaTrocaEl.innerHTML = `
        <span id="txtTroca">Entrada do iPhone ${troca.modelo}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span id="valorTroca">− ${fmt(descontoTroca)}</span>
          <button type="button" id="btnRemoverTroca" style="background:transparent; border:none; color:#ff453a; cursor:pointer; font-size:14px;" title="Remover Troca">✕</button>
        </div>
      `;

      document.getElementById('btnRemoverTroca').addEventListener('click', () => {
        gravarTroca(null);
        renderCarrinho();
        toast('Troca de aparelho removida');
      });

    } else if (linhaTrocaEl) {
      linhaTrocaEl.hidden = true;
    }

    if (estado.cupom && cupomInput && cupomBtn && cupomMsg) {
      cupomInput.value = estado.cupom.codigo;
      cupomInput.disabled = true;
      cupomBtn.textContent = 'Remover';
      cupomMsg.textContent = `✓ Cupom aplicado: ${estado.cupom.descricao}`;
      cupomMsg.className = 'cupom-msg ok';
    } else if (cupomInput && cupomBtn && cupomMsg) {
      cupomInput.value = '';
      cupomInput.disabled = false;
      cupomBtn.textContent = 'Aplicar';
      cupomMsg.textContent = '';
      cupomMsg.className = 'cupom-msg';
    }

    const qtd = qtdCarrinho(estado.carrinho);
    if (badgeEl) {
      badgeEl.textContent = qtd;
      badgeEl.classList.toggle('visivel', qtd > 0);
    }

    atualizarBarraFreteGratis();
  }

  function atualizarBarraFreteGratis() {
    const el = document.getElementById('barraFreteGratis');
    if (!el) return;
    if (estado.carrinho.length === 0) { el.hidden = true; return; }
    el.hidden = false;

    const subtotal = totalCarrinho(estado.carrinho);
    const falta = FRETE_GRATIS_VALOR - subtotal;
    const pct   = Math.min(100, (subtotal / FRETE_GRATIS_VALOR) * 100);

    const textoEl      = el.querySelector('.frete-texto');
    const preenchidaEl = el.querySelector('.frete-barra-preenchida');

    if (falta <= 0) {
      el.classList.add('completo');
      textoEl.innerHTML = '🎉 <strong>Frete grátis liberado!</strong>';
      preenchidaEl.style.width = '100%';
    } else {
      el.classList.remove('completo');
      textoEl.innerHTML = `Faltam <strong>${fmt(falta)}</strong> para o frete grátis`;
      preenchidaEl.style.width = `${pct}%`;
    }
  }

  function salvarERenderizar() {
    gravarCarrinho(estado.carrinho);
    renderCarrinho();
  }

  function animarBadge() {
    if (!badgeEl) return;
    badgeEl.classList.remove('pop');
    void badgeEl.offsetWidth;
    badgeEl.classList.add('pop');
  }

  function adicionar(item) {
    adicionarItem(estado.carrinho, item);
    salvarERenderizar();
    animarBadge();
    toast(`${item.nome} adicionado à sacola`);
    abrirCarrinho();
  }

  function abrirCarrinho() {
    if (!carrinhoEl) return;
    carrinhoEl.classList.add('aberto');
    backdrop?.classList.add('aberto');
    document.body.classList.add('travado');
  }

  function fecharCarrinho() {
    if (!carrinhoEl) return;
    carrinhoEl.classList.remove('aberto');
    backdrop?.classList.remove('aberto');
    const modalAberto = document.getElementById('modal')?.classList.contains('aberto');
    if (!modalAberto) {
      document.body.classList.remove('travado');
    }
  }

  cupomBtn?.addEventListener('click', () => {
    if (estado.cupom) {
      estado.cupom = null;
      gravarCupom(null);
      renderCarrinho();
      toast('Cupom removido');
      return;
    }

    const codigo = cupomInput.value.trim().toUpperCase();
    if (!codigo) {
      cupomMsg.textContent = 'Digite um código.';
      cupomMsg.className = 'cupom-msg erro';
      return;
    }

    const cupom = acharCupom(codigo);
    if (!cupom) {
      cupomMsg.textContent = 'Cupom inválido ou expirado.';
      cupomMsg.className = 'cupom-msg erro';
      return;
    }

    estado.cupom = { codigo, ...cupom };
    gravarCupom(estado.cupom);
    renderCarrinho();
    toast(`Cupom "${codigo}" aplicado!`);
  });

  cupomInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') cupomBtn.click();
  });

  listaEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('.remover');
    if (!btn) return;
    estado.carrinho.splice(Number(btn.dataset.i), 1);
    salvarERenderizar();
  });

  document.getElementById('btnCarrinho')?.addEventListener('click', abrirCarrinho);
  document.getElementById('fecharCarrinho')?.addEventListener('click', fecharCarrinho);
  backdrop?.addEventListener('click', fecharCarrinho);

  document.getElementById('finalizar')?.addEventListener('click', () => {
    if (estado.carrinho.length === 0) {
      toast('Sua sacola está vazia.');
      return;
    }
    window.location.href = 'checkout.html';
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharCarrinho();
  });

  return {
    render: renderCarrinho,
    abrir: abrirCarrinho,
    fechar: fecharCarrinho,
    adicionar,
    salvarERenderizar
  };
}
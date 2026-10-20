/* =========================================================
   LANDING PAGE — interatividade compartilhada
   ========================================================= */

(function () {
  'use strict';

  const main = document.querySelector('.landing');
  if (!main) return;

  const idProduto = main.dataset.produto;
  let produto = null;

  const estado = {
    corIndex: 0,
    capIndex: 0,
    imgIndex: 0,
    carrinho: lerCarrinho(),
    cupom: lerCupom(),
    favoritos: lerFavoritos()
  };

  const carrinhoUI = iniciarCarrinhoUI(estado);

  function montarImagensStack() {
    const stack = document.getElementById('landingStack');
    if (!stack || !produto) return;

    stack.innerHTML = produto.cores.map((c, corIdx) => {
      if (!c.imagens && !c.imagem) {
        return `<div class="phone phone-modal-fallback" data-cor="${corIdx}"
                     style="--c:${escapeHTML(c.hex)}; display:${corIdx === 0 ? 'block' : 'none'}"></div>`;
      }
      const lista = c.imagens || [c.imagem];
      return lista.map((src, imgIdx) => `
        <img src="${escapeHTML(src)}"
             alt="${escapeHTML(produto.nome)} — ${escapeHTML(c.nome)}"
             class="phone-img"
             data-cor="${corIdx}"
             data-img="${imgIdx}"
             draggable="false">
      `).join('');
    }).join('');
  }

  function trocarCor(novaCor) {
    estado.imgIndex = 0;
    const stack = document.getElementById('landingStack');
    if (!stack) return;
    stack.dataset.cor = novaCor;

    stack.querySelectorAll('.phone-img, .phone-modal-fallback').forEach((el) => {
      const mesmaCor = Number(el.dataset.cor) === novaCor;
      const primeira = Number(el.dataset.img || 0) === 0;
      const ativo = mesmaCor && primeira;
      el.classList.toggle('ativa', ativo);
      if (el.classList.contains('phone-modal-fallback')) {
        el.style.display = ativo ? 'block' : 'none';
      }
    });
  }

  function montarOpcoes() {
    const elCores = document.getElementById('landingCores');
    const elCaps = document.getElementById('landingCaps');
    if (!elCores || !elCaps || !produto) return;

    elCores.innerHTML = produto.cores.map((c, i) => `
      <button class="cor ${i === 0 ? 'ativa' : ''}"
              style="background:${escapeHTML(c.hex)}"
              data-i="${i}"
              title="${escapeHTML(c.nome)}"
              aria-label="${escapeHTML(c.nome)}"></button>
    `).join('');

    elCaps.innerHTML = produto.capacidades.map((c, i) => `
      <button class="cap ${i === 0 ? 'ativa' : ''}" data-i="${i}">${escapeHTML(c.cap)}</button>
    `).join('');

    elCores.addEventListener('click', (e) => {
      const btn = e.target.closest('.cor');
      if (!btn) return;
      estado.corIndex = Number(btn.dataset.i);
      elCores.querySelectorAll('.cor').forEach((el) => el.classList.remove('ativa'));
      btn.classList.add('ativa');

      const nomeEl = document.getElementById('landingNomeCor');
      if (nomeEl) nomeEl.textContent = produto.cores[estado.corIndex].nome;

      trocarCor(estado.corIndex);
    });

    elCaps.addEventListener('click', (e) => {
      const btn = e.target.closest('.cap');
      if (!btn) return;
      estado.capIndex = Number(btn.dataset.i);
      elCaps.querySelectorAll('.cap').forEach((el) => el.classList.remove('ativa'));
      btn.classList.add('ativa');
      atualizarPreco();
    });
  }

  function atualizarPreco() {
    if (!produto) return;
    const preco = produto.base + produto.capacidades[estado.capIndex].extra;

    const el = document.getElementById('landingPreco');
    if (el) {
      el.textContent = fmt(preco);
      el.classList.remove('muda');
      void el.offsetWidth;
      el.classList.add('muda');
    }

    const parcelaEl = document.getElementById('landingParcela');
    if (parcelaEl) parcelaEl.textContent = parcela(preco);
  }

  function adicionar() {
    if (!produto) return;
    const cor = produto.cores[estado.corIndex];
    const cap = produto.capacidades[estado.capIndex];
    const preco = produto.base + cap.extra;

    carrinhoUI.adicionar({
      produtoId: produto.id,
      nome: produto.nome,
      cor: cor.nome,
      corHex: cor.hex,
      cap: cap.cap,
      preco
    });

    if (typeof trackAddToCart === 'function') {
      trackAddToCart(produto, 1, preco);
    }
  }

  function montarCta() {
    document.querySelectorAll('[data-add-carrinho]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        adicionar();
      });
    });
  }

  function montarCrossSell() {
    const el = document.getElementById('landingOutros');
    if (!el || !produto) return;

    const outros = PRODUTOS.filter((p) => p.id !== produto.id).slice(0, 4);

    el.innerHTML = outros.map((p) => `
      <article class="card card-recente" onclick="location.href='${escapeHTML(p.slug || ('produto.html?id=' + p.id))}'">
        <div class="card-media">
          ${htmlImagemProduto(p, 0)}
        </div>
        <h3>${escapeHTML(p.nome)}</h3>
        <p class="preco"><strong>${fmt(p.base)}</strong></p>
      </article>
    `).join('');
  }

  function initLanding() {
    produto = acharProduto(idProduto);
    if (!produto) {
      console.warn('[landing] produto não encontrado:', idProduto);
      return;
    }

    if (typeof aplicarSeoProduto === 'function') {
      aplicarSeoProduto(produto);
    }

    if (typeof trackViewItem === 'function') {
      trackViewItem(produto);
    }

    montarImagensStack();
    trocarCor(0);
    montarOpcoes();
    atualizarPreco();
    montarCta();
    montarCrossSell();
  }

  document.addEventListener('produtosProntos', initLanding);
  if (typeof PRODUTOS !== 'undefined' && PRODUTOS.length > 0) {
    initLanding();
  }

  carrinhoUI.render();
})();
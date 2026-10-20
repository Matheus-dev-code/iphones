/* =========================================================
   COMPARADOR — até 3 produtos, spec por spec
   ========================================================= */

let comparando = lerComparando();

function htmlBotaoComparar(produtoId) {
  const ativo = comparando.includes(produtoId);
  return `
    <button class="comparar-btn ${ativo ? 'ativo' : ''}"
            data-comparar="${produtoId}"
            type="button"
            aria-label="${ativo ? 'Remover da comparação' : 'Adicionar à comparação'}"
            title="${ativo ? 'Remover da comparação' : 'Comparar'}">
      ⚖️
    </button>
  `;
}

function alternarComparar(produtoId) {
  const idx = comparando.indexOf(produtoId);
  const prod = acharProduto(produtoId);

  if (idx >= 0) {
    comparando.splice(idx, 1);
    toast(`${prod.nome} removido da comparação`);
  } else {
    if (comparando.length >= COMPARAR_MAX) {
      toast(`Máximo de ${COMPARAR_MAX} produtos por comparação`);
      return;
    }
    comparando.push(produtoId);
    toast(`⚖️ ${prod.nome} adicionado à comparação`);
  }

  gravarComparando(comparando);
  renderBarraComparar();
  atualizarBotoesComparar();
}

function atualizarBotoesComparar() {
  document.querySelectorAll('.comparar-btn').forEach((btn) => {
    const ativo = comparando.includes(btn.dataset.comparar);
    btn.classList.toggle('ativo', ativo);
    btn.setAttribute('aria-label', ativo ? 'Remover da comparação' : 'Adicionar à comparação');
  });
}

function renderBarraComparar() {
  const el = document.getElementById('barraComparar');
  if (!el) return;

  if (comparando.length === 0) {
    el.classList.remove('visivel');
    return;
  }

  el.classList.add('visivel');

  const slots = [0, 1, 2].map((i) => {
    const id = comparando[i];
    if (id) {
      const p = acharProduto(id);
      if (!p) return `<div class="comparar-slot vazio" aria-hidden="true"></div>`;
      return `
        <div class="comparar-slot preenchido" title="${escapeHTML(p.nome)}">
          <div class="comparar-slot-mini" style="--c:${escapeHTML(p.cores[0].hex)}"></div>
          <button class="comparar-slot-remover" type="button" data-remover="${escapeHTML(id)}" aria-label="Remover">✕</button>
        </div>
      `;
    }
    return `<div class="comparar-slot vazio" aria-hidden="true"></div>`;
  }).join('');

  el.innerHTML = `
    <div class="comparar-slots">${slots}</div>
    <span class="comparar-texto">
      ${comparando.length} de ${COMPARAR_MAX} selecionados
    </span>
    <div class="comparar-acoes">
      <button class="comparar-limpar" type="button" id="compararLimpar">Limpar</button>
      <button class="comparar-abrir" type="button" id="compararAbrir" ${comparando.length < 2 ? 'disabled' : ''}>
        Comparar
      </button>
    </div>
  `;

  el.querySelectorAll('[data-remover]').forEach((btn) => {
    btn.addEventListener('click', () => alternarComparar(btn.dataset.remover));
  });

  document.getElementById('compararLimpar').addEventListener('click', limparComparar);
  document.getElementById('compararAbrir').addEventListener('click', abrirModalComparar);
}

function limparComparar() {
  comparando = [];
  gravarComparando(comparando);
  renderBarraComparar();
  atualizarBotoesComparar();
  toast('Comparação limpa');
}

function abrirModalComparar() {
  if (comparando.length < 2) {
    toast('Selecione pelo menos 2 produtos');
    return;
  }

  const produtos = comparando.map(acharProduto).filter(Boolean);
  const modal = document.getElementById('modalComparar');
  const box = document.getElementById('modalCompararBox');

  const colunas = produtos.length;

  const linhaProdutos = produtos.map((p) => `
    <div class="comparar-col">
      <div class="comparar-produto">
        <div class="comparar-produto-img">
          ${htmlImagemProduto(p, 0)}
        </div>
        <h3>${escapeHTML(p.nome)}</h3>
        <p class="comparar-tagline">${escapeHTML(p.tagline)}</p>
      </div>
    </div>
  `).join('');

  function linha(rotulo, render) {
    const valores = produtos.map((p) => `
      <div class="comparar-col">${render(p)}</div>
    `).join('');
    return `
      <div class="comparar-linha">
        <div class="comparar-rotulo">${escapeHTML(rotulo)}</div>
        <div class="comparar-valores">${valores}</div>
      </div>
    `;
  }

  const linhaRating = linha('Avaliação', (p) => {
    const cheias = Math.round(p.rating);
    const estrelas = [1, 2, 3, 4, 5]
      .map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`)
      .join('');
    return `
      <div class="estrelas" style="margin:0">${estrelas}<span class="nota">${p.rating.toFixed(1)}</span></div>
      <span class="comparar-sub">${p.avaliacoes} avaliações</span>
    `;
  });

  const linhaPreco = linha('Preço', (p) => `
    <strong class="comparar-preco">${fmt(p.base)}</strong>
    <span class="comparar-sub">ou 12x de ${parcela(p.base)}</span>
  `);

  const linhaSelo = linha('Status', (p) => p.selo
    ? `<span class="comparar-selo">${escapeHTML(p.selo)}</span>`
    : '<span class="comparar-sub">—</span>'
  );

  const linhaChip = linha('Chip', (p) => `
    <span class="comparar-valor">${escapeHTML(p.specs?.chip || '—')}</span>
  `);

  const linhaBench = linha('Desempenho', (p) => {
    const score = p.specs?.benchmark || 0;
    if (!score) return '<span class="comparar-sub">—</span>';
    const max = Math.max(...produtos.map((x) => x.specs?.benchmark || 0));
    const pct = max ? Math.round((score / max) * 100) : 0;
    return `
      <div class="comparar-bench">
        <div class="comparar-bench-barra"><div class="comparar-bench-fill" style="width:${pct}%"></div></div>
        <span class="comparar-sub">${(score / 1000).toFixed(0)}k pts</span>
      </div>
    `;
  });

  const linhaTela = linha('Tela', (p) => `
    <span class="comparar-valor">${escapeHTML(p.specs?.tela || '—')}</span>
    <span class="comparar-sub">${p.specs?.telaPolegadas ? p.specs.telaPolegadas.toFixed(1) + '"' : ''}</span>
  `);

  const linhaBateria = linha('Bateria', (p) => {
    const h = p.specs?.bateria;
    if (!h) return '<span class="comparar-sub">—</span>';
    const max = Math.max(...produtos.map((x) => x.specs?.bateria || 0));
    const pct = max ? Math.round((h / max) * 100) : 0;
    return `
      <div class="comparar-bench">
        <div class="comparar-bench-barra"><div class="comparar-bench-fill verde" style="width:${pct}%"></div></div>
        <span class="comparar-sub">${h}h de vídeo</span>
      </div>
    `;
  });

  const linhaPeso = linha('Peso', (p) => p.specs?.peso
    ? `<span class="comparar-valor">${p.specs.peso} g</span>`
    : '<span class="comparar-sub">—</span>'
  );

  const linhaZoom = linha('Zoom óptico', (p) => `
    <span class="comparar-valor">${escapeHTML(p.specs?.zoomOptico || '—')}</span>
  `);

  const linhaMaterial = linha('Acabamento', (p) => `
    <span class="comparar-valor">${escapeHTML(p.specs?.material || '—')}</span>
  `);

  const linhaResistencia = linha('Resistência', (p) => `
    <span class="comparar-valor">${escapeHTML(p.specs?.resistencia || '—')}</span>
  `);

  const linhaCores = linha('Cores', (p) => `
    <div class="comparar-cores">
      ${p.cores.map((c) => `
        <span class="comparar-cor" style="background:${escapeHTML(c.hex)}" title="${escapeHTML(c.nome)}"></span>
      `).join('')}
    </div>
    <span class="comparar-sub">${p.cores.length} cores</span>
  `);

  const linhaCaps = linha('Armazenamento', (p) => `
    <div class="comparar-caps">
      ${p.capacidades.map((c) => `<span class="comparar-cap">${escapeHTML(c.cap)}</span>`).join('')}
    </div>
  `);

  const linhaEstoque = linha('Estoque', (p) => {
    const est = p.estoque;
    if (est === undefined || est === null) return '<span class="comparar-sub">—</span>';
    if (est <= 0) return `<span class="comparar-estoque esgotado">Esgotado</span>`;
    if (est <= 5) return `<span class="comparar-estoque alerta">${est} un.</span>`;
    return `<span class="comparar-estoque ok">${est} un.</span>`;
  });

  const linhaAcoes = produtos.map((p) => `
    <div class="comparar-col">
      <button class="btn-primario comparar-add" type="button" data-add="${escapeHTML(p.id)}">
        Adicionar à sacola
      </button>
    </div>
  `).join('');

  box.innerHTML = `
    <button class="fechar" id="fecharModalComparar" aria-label="Fechar">✕</button>
    <h2 class="comparar-titulo">Comparando ${colunas} iPhones</h2>

    <div class="comparar-tabela" style="--colunas:${colunas}">

      <div class="comparar-linha comparar-linha-produtos">
        ${linhaProdutos}
      </div>

      ${linhaRating}
      ${linhaPreco}
      ${linhaSelo}
      ${linhaChip}
      ${linhaBench}
      ${linhaTela}
      ${linhaBateria}
      ${linhaPeso}
      ${linhaZoom}
      ${linhaMaterial}
      ${linhaResistencia}
      ${linhaCores}
      ${linhaCaps}
      ${linhaEstoque}

      <div class="comparar-linha comparar-linha-acoes">
        ${linhaAcoes}
      </div>
    </div>
  `;

  document.getElementById('fecharModalComparar').addEventListener('click', fecharModalComparar);

  box.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = acharProduto(btn.dataset.add);
      if (!prod) return;
      adicionarAoCarrinho(prod);
    });
  });

  modal.classList.add('aberto');
  document.body.classList.add('travado');

  if (typeof track === 'function') {
    track('comparar_aberto', { produtos: produtos.map((p) => p.id).join(',') });
  }
}

function fecharModalComparar() {
  const modal = document.getElementById('modalComparar');
  modal.classList.remove('aberto');
  document.body.classList.remove('travado');
}

function adicionarAoCarrinho(prod) {
  const cor = prod.cores[0];
  const cap = prod.capacidades[0];
  const preco = prod.base + cap.extra;

  const itens = lerCarrinho();
  adicionarItem(itens, {
    produtoId: prod.id,
    nome: prod.nome,
    cor: cor.nome,
    corHex: cor.hex,
    cap: cap.cap,
    preco
  });
  gravarCarrinho(itens);

  if (typeof toast === 'function') {
    toast(`${prod.nome} adicionado à sacola`);
  }
  if (typeof trackAddToCart === 'function') {
    trackAddToCart(prod, 1, preco);
  }

  if (typeof window.carrinhoUI?.render === 'function') {
    window.carrinhoUI.render();
  } else {
    location.reload();
  }

  fecharModalComparar();
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.comparar-btn');
  if (btn) {
    e.stopPropagation();
    alternarComparar(btn.dataset.comparar);
  }
});

document.addEventListener('click', (e) => {
  const modal = document.getElementById('modalComparar');
  if (modal && e.target === modal) fecharModalComparar();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modalComparar');
    if (modal && modal.classList.contains('aberto')) fecharModalComparar();
  }
});

document.addEventListener('produtosProntos', renderBarraComparar);
if (typeof PRODUTOS !== 'undefined' && PRODUTOS.length > 0) {
  renderBarraComparar();
}
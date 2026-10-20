/* =========================================================
   HOME — grid, filtros, modal, cupons, FAQ, banner, newsletter
   ========================================================= */

const observador = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('visivel');
        observador.unobserve(entrada.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
);

const estado = {
  produtoAtual: null, corIndex: 0, capIndex: 0, imgIndex: 0,
  carrinho: lerCarrinho(), cupom: lerCupom(), favoritos: lerFavoritos(),
  filtroCategoria: 'todos', busca: '', ordenacao: 'relevancia',
  precoMin: PRECO_MIN, precoMax: PRECO_MAX
};

const $ = (sel) => document.querySelector(sel);
const grid = $('#grid');
const semResultados = $('#semResultados');
const modal = $('#modal');
const modalBox = $('#modalBox');

let trapModal = null;
const carrinhoUI = iniciarCarrinhoUI(estado);

function htmlEstrelas(rating, avaliacoes) {
  const notaSegura = Number(rating) || 0;
  const avalSeguro = Number(avaliacoes) || 0;
  const cheias = Math.round(notaSegura);
  const estrelas = [1, 2, 3, 4, 5].map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`).join('');
  return `
    <div class="estrelas" aria-label="${notaSegura} de 5 estrelas">
      ${estrelas}
      <span class="nota">${notaSegura.toFixed(1)}</span>
      <span class="qtd">(${avalSeguro})</span>
    </div>
  `;
}

function formatarDataAntiga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function aplicarFiltros() {
  const termo = estado.busca.trim().toLowerCase();
  const cat = estado.filtroCategoria;
  let lista = PRODUTOS.filter((p) => {
    if (cat === 'favoritos') { if (!estado.favoritos.includes(p.id)) return false; }
    else if (cat !== 'todos') { if (p.categoria !== cat) return false; }
    if (termo) { const alvo = (p.nome + ' ' + p.tagline).toLowerCase(); if (!alvo.includes(termo)) return false; }
    if (p.base < estado.precoMin || p.base > estado.precoMax) return false;
    return true;
  });
  return ordenarLista(lista, estado.ordenacao);
}

function renderGrid() {
  const lista = aplicarFiltros();

  if (lista.length === 0) {
    grid.innerHTML = '';
    semResultados.hidden = false;
    if (estado.filtroCategoria === 'favoritos') semResultados.textContent = 'Você ainda não favoritou nenhum iPhone. 💔';
    else semResultados.textContent = 'Nenhum produto encontrado com esses filtros.';
    return;
  }
  semResultados.hidden = true;

  grid.innerHTML = lista.map((p, i) => {
    const favoritado = estado.favoritos.includes(p.id);
    const btnComparar = (typeof htmlBotaoComparar === 'function') ? htmlBotaoComparar(p.id) : '';

    const estoqueTotal = Object.values(p.estoqueVariacoes || {}).reduce((a, b) => a + b, 0);
    const esgotadoGeral = p.estoqueVariacoes && estoqueTotal === 0;

    const nivel = nivelEstoque(p);
    const textoEst = textoEstoque(p);
    const urgenciaHTML = textoEst ? `<div class="urgencia ${nivel}"><span class="pulso"></span>${escapeHTML(textoEst)}</div>` : '';

    return `
      <article class="card reveal" data-id="${escapeHTML(p.id)}" style="--d:${i * 70}ms">
        ${p.selo ? `<span class="selo">${escapeHTML(p.selo)}</span>` : ''}
        ${esgotadoGeral ? `<span class="selo" style="background:rgba(255,69,58,.2); color:#ff453a; border-color:rgba(255,69,58,.4);">Esgotado</span>` : ''}

        <button class="wishlist ${favoritado ? 'ativo' : ''}" data-wishlist="${escapeHTML(p.id)}" aria-label="${favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" type="button"></button>
        ${btnComparar}
        <div class="card-media">${htmlImagemProduto(p, 0)}</div>
        <h3>${escapeHTML(p.nome)}</h3>
        ${htmlEstrelas(p.rating, p.avaliacoes)}
        <p class="tag">${escapeHTML(p.tagline)}</p>
        ${urgenciaHTML}
        <p class="preco">A partir de <strong>${fmt(p.base)}</strong></p>
        <button class="btn-ghost">Ver detalhes</button>
      </article>
    `;
  }).join('');

  document.querySelectorAll('#grid .reveal').forEach((el) => observador.observe(el));
  if (typeof atualizarBotoesComparar === 'function') atualizarBotoesComparar();
}

grid.addEventListener('click', (e) => {
  const wish = e.target.closest('.wishlist');
  if (wish) { e.stopPropagation(); toggleFavorito(wish.dataset.wishlist); return; }
  if (e.target.closest('.comparar-btn')) { e.stopPropagation(); return; }
  const card = e.target.closest('.card');
  if (card) abrirModal(card.dataset.id);
});

function toggleFavorito(id) {
  const agoraFavoritado = alternarFavorito(id);
  estado.favoritos = lerFavoritos();
  const prod = acharProduto(id);
  toast(agoraFavoritado ? `❤️ ${prod.nome} adicionado aos favoritos` : `${prod.nome} removido dos favoritos`);
  atualizarBadgeFavoritos(true);
  renderGrid();
}

function atualizarBadgeFavoritos(animar = false) {
  const el = document.getElementById('badgeFav');
  if (!el) return;
  const qtd = estado.favoritos.length;
  el.textContent = qtd;
  el.classList.toggle('visivel', qtd > 0);
  if (animar) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
}

document.getElementById('btnFavoritos').addEventListener('click', () => {
  estado.filtroCategoria = 'favoritos';
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('ativo'));
  const chipFav = document.querySelector('.chip[data-filtro="favoritos"]');
  if (chipFav) chipFav.classList.add('ativo');
  renderGrid();
  document.getElementById('produtos').scrollIntoView({ behavior: 'smooth' });
});

const buscaInput = $('#busca');
const buscaSugestoes = $('#buscaSugestoes');
let sugestaoFoco = -1;

function renderSugestoes(termo) {
  if (!termo || termo.length < 2) { buscaSugestoes.hidden = true; buscaSugestoes.innerHTML = ''; return; }
  const t = termo.toLowerCase();
  const matches = PRODUTOS.filter((p) => (p.nome + ' ' + p.tagline).toLowerCase().includes(t)).slice(0, 5);

  if (matches.length === 0) {
    buscaSugestoes.hidden = false;
    buscaSugestoes.innerHTML = `<div class="sugestao-vazia">Nenhum resultado para "${escapeHTML(termo)}"</div>`;
    return;
  }

  buscaSugestoes.hidden = false;
  buscaSugestoes.innerHTML = matches.map((p, i) => `
    <button class="sugestao" type="button" data-id="${escapeHTML(p.id)}" data-i="${i}">
      <div class="sugestao-mini" style="--c:${p.cores && p.cores[0] ? escapeHTML(p.cores[0].hex) : '#333'}"></div>
      <div class="sugestao-info">
        <span class="sugestao-nome">${destacarTermo(p.nome, termo)}</span>
        <span class="sugestao-tag">${destacarTermo(p.tagline, termo)}</span>
      </div>
      <span class="sugestao-preco">${fmt(p.base)}</span>
    </button>
  `).join('');

  buscaSugestoes.querySelectorAll('.sugestao').forEach((btn) => {
    btn.addEventListener('click', () => {
      abrirModal(btn.dataset.id);
      buscaSugestoes.hidden = true; buscaInput.value = ''; estado.busca = '';
    });
  });
  sugestaoFoco = -1;
}

buscaInput.addEventListener('input', (e) => { estado.busca = e.target.value; renderGrid(); renderSugestoes(estado.busca); });
buscaInput.addEventListener('keydown', (e) => {
  const itens = buscaSugestoes.querySelectorAll('.sugestao');
  if (!itens.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); sugestaoFoco = Math.min(sugestaoFoco + 1, itens.length - 1); atualizarFocoSugestao(itens); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sugestaoFoco = Math.max(sugestaoFoco - 1, 0); atualizarFocoSugestao(itens); }
  else if (e.key === 'Enter' && sugestaoFoco >= 0) { e.preventDefault(); itens[sugestaoFoco].click(); }
  else if (e.key === 'Escape') { buscaSugestoes.hidden = true; }
});

function atualizarFocoSugestao(itens) { itens.forEach((el, i) => el.classList.toggle('focado', i === sugestaoFoco)); }
document.addEventListener('click', (e) => { if (!e.target.closest('.busca-wrap')) buscaSugestoes.hidden = true; });

const sliderMin = $('#precoMin');
const sliderMax = $('#precoMax');
const sliderRange = $('#precoRange');
const labelMin = $('#precoMinLabel');
const labelMax = $('#precoMaxLabel');

function atualizarSlider() {
  if (!sliderMin || !sliderMax) return;
  let min = Number(sliderMin.value);
  let max = Number(sliderMax.value);

  if (min > max - 500) {
    if (document.activeElement === sliderMin) { sliderMin.value = max - 500; min = max - 500; }
    else { sliderMax.value = min + 500; max = min + 500; }
  }

  estado.precoMin = min; estado.precoMax = max;
  const pct = ((min - PRECO_MIN) / (PRECO_MAX - PRECO_MIN)) * 100;
  const pctFim = ((max - PRECO_MIN) / (PRECO_MAX - PRECO_MIN)) * 100;
  sliderRange.style.left = pct + '%';
  sliderRange.style.right = (100 - pctFim) + '%';
  labelMin.textContent = fmt(min); labelMax.textContent = fmt(max);
  renderGrid();
}

if (sliderMin && sliderMax) {
  sliderMin.addEventListener('input', atualizarSlider);
  sliderMax.addEventListener('input', atualizarSlider);
  sliderMin.value = PRECO_MIN; sliderMax.value = PRECO_MAX;
}

function limparFiltros() {
  estado.filtroCategoria = 'todos'; estado.busca = ''; estado.ordenacao = 'relevancia';
  estado.precoMin = PRECO_MIN; estado.precoMax = PRECO_MAX;
  buscaInput.value = ''; $('#ordenacao').value = 'relevancia';
  sliderMin.value = PRECO_MIN; sliderMax.value = PRECO_MAX;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('ativo'));
  document.querySelector('.chip[data-filtro="todos"]').classList.add('ativo');
  atualizarSlider(); toast('Filtros limpos');
}
document.getElementById('limparFiltros')?.addEventListener('click', limparFiltros);

$('#chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  estado.filtroCategoria = chip.dataset.filtro;
  document.querySelectorAll('.chip').forEach((c) => c.classList.remove('ativo'));
  chip.classList.add('ativo');
  renderGrid();
});

$('#ordenacao').addEventListener('change', (e) => { estado.ordenacao = e.target.value; renderGrid(); });

/* =========================================================
   MODAL DO PRODUTO
   ========================================================= */
function abrirModal(id) {
  const p = acharProduto(id);
  if (!p) return;
  estado.produtoAtual = p; estado.corIndex = 0; estado.capIndex = 0; estado.imgIndex = 0;
  renderModal();
  modal.classList.add('aberto'); document.body.classList.add('travado');
  trapModal = trapFocus(modalBox);
  track('view_item', { item_id: p.id, item_name: p.nome, price: p.base, currency: 'BRL' });
}

function renderModal() {
  const p = estado.produtoAtual;
  const preco = p.base + (p.capacidades[estado.capIndex]?.extra || 0);
  const cor = p.cores && p.cores[estado.corIndex] ? p.cores[estado.corIndex] : { nome: 'Padrão', hex: '#333', imagens: [] };

  const todasReviews = reviewsDoProduto(p.id);
  const reviewsPreview = todasReviews.slice(0, 2);
  const mediaPreview = todasReviews.length ? mediaReviews(todasReviews) : (Number(p.rating) || 5.0);

  const reviewsHTML = reviewsPreview.length
    ? reviewsPreview.map((r) => {
        const cheias = Math.round(r.nota);
        const estrelas = [1, 2, 3, 4, 5].map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`).join('');
        const dataTexto = r.data ? (r.data.includes('T') ? tempoRelativo(r.data) : formatarDataAntiga(r.data)) : '';
        return `
          <div class="review-preview">
            <div class="review-preview-topo"><strong>${escapeHTML(r.autor)}</strong><span class="review-preview-data">${escapeHTML(dataTexto)}</span></div>
            <div class="estrelas review-preview-estrelas">${estrelas}</div>
            <p class="review-preview-texto">${escapeHTML(r.texto)}</p>
          </div>
        `;
      }).join('')
    : '<p class="review-preview-vazio">Ainda não há avaliações para esse modelo.</p>';

  const imagensStack = p.cores ? p.cores.map((c, corIdx) => {
    if (!c.imagens && !c.imagem) {
      return `<div class="phone phone-modal-fallback" data-cor="${corIdx}" style="--c:${escapeHTML(c.hex)}; display:${corIdx === estado.corIndex ? 'block' : 'none'}"></div>`;
    }
    const lista = c.imagens || [c.imagem];
    return lista.map((src, imgIdx) => `
      <img src="${escapeHTML(src)}" alt="${escapeHTML(p.nome)} — ${escapeHTML(c.nome)}" class="phone-img phone-modal-img" data-cor="${corIdx}" data-img="${imgIdx}" loading="lazy" draggable="false">
    `).join('');
  }).join('') : '';

  const totalImagens = (cor.imagens && cor.imagens.length) || 1;
  const dotsHTML = totalImagens > 1
    ? `<div class="phone-dots" id="phoneDots">${Array.from({ length: totalImagens }).map((_, i) => `<button class="phone-dot ${i === 0 ? 'ativa' : ''}" type="button" data-img="${i}" aria-label="Ângulo ${i + 1}"></button>`).join('')}</div>`
    : '';

  modalBox.innerHTML = `
    <button class="fechar" id="fecharModal" aria-label="Fechar">✕</button>
    <div class="modal-grid">
      <div class="modal-visual">
        <div class="phone-stack" id="phoneStack" data-cor="${estado.corIndex}">${imagensStack}</div>
        ${dotsHTML}
      </div>
      <div>
        <h3>${escapeHTML(p.nome)}</h3>
        ${htmlEstrelas(mediaPreview, todasReviews.length || p.avaliacoes)}
        <p class="modal-tag">${escapeHTML(p.tagline)}</p>

        <div id="urgenciaModal"></div>

        <p class="opcao-titulo">Cor — <span id="nomeCor">${escapeHTML(cor.nome)}</span></p>
        <div class="cores" id="cores">
          ${(p.cores || []).map((c, i) => `<button class="cor ${i === estado.corIndex ? 'ativa' : ''}" style="background:${escapeHTML(c.hex)}" data-i="${i}" title="${escapeHTML(c.nome)}" aria-label="${escapeHTML(c.nome)}"></button>`).join('')}
        </div>
        <p class="opcao-titulo">Armazenamento</p>
        <div class="capacidades" id="capacidades">
          ${(p.capacidades || []).map((c, i) => `<button class="cap ${i === estado.capIndex ? 'ativa' : ''}" data-i="${i}">${escapeHTML(c.cap)}</button>`).join('')}
        </div>
        <div class="modal-preco">
          <div class="valor" id="valorModal">${fmt(preco)}</div>
          <div class="parcela">ou 12x de<br><strong>${parcela(preco)}</strong></div>
        </div>

        <button class="btn-primario" id="addCarrinho">Adicionar à sacola</button>

        <div class="modal-reviews"><p class="opcao-titulo">O que estão dizendo</p>${reviewsHTML}<a class="btn-link" href="produto.html?id=${encodeURIComponent(p.id)}#reviews">Ver todas as avaliações →</a></div>
        <a class="btn-link" href="produto.html?id=${encodeURIComponent(p.id)}">Ver página completa →</a>
      </div>
    </div>
  `;

  trocarCorNoStack(0);
  atualizarStatusCompraModal();

  $('#fecharModal').addEventListener('click', fecharModal);

  $('#cores').addEventListener('click', (e) => {
    const btn = e.target.closest('.cor');
    if (!btn) return;
    estado.corIndex = Number(btn.dataset.i);
    document.querySelectorAll('.cor').forEach((el) => el.classList.remove('ativa'));
    btn.classList.add('ativa');
    $('#nomeCor').textContent = p.cores[estado.corIndex].nome;
    trocarCorNoStack(estado.corIndex);
    atualizarStatusCompraModal();
  });

  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) { dotsEl.addEventListener('click', (e) => { const dot = e.target.closest('.phone-dot'); if (!dot) return; trocarAnguloNoStack(Number(dot.dataset.img)); }); }

  const stack = document.getElementById('phoneStack');
  if (stack) {
    stack.addEventListener('click', () => {
      const c = p.cores[estado.corIndex];
      const total = (c.imagens && c.imagens.length) || 1;
      if (total <= 1) return;
      const proximo = (estado.imgIndex + 1) % total;
      trocarAnguloNoStack(proximo);
    });
  }

  $('#capacidades').addEventListener('click', (e) => {
    const btn = e.target.closest('.cap');
    if (!btn) return;
    estado.capIndex = Number(btn.dataset.i);
    document.querySelectorAll('.cap').forEach((el) => el.classList.remove('ativa'));
    btn.classList.add('ativa');
    atualizarPrecoModal();
    atualizarStatusCompraModal();
  });

  $('#addCarrinho').addEventListener('click', () => {
    const corSel = p.cores[estado.corIndex];
    const capSel = p.capacidades[estado.capIndex];

    if (variacaoEsgotada(p, corSel.nome, capSel.cap)) return;

    carrinhoUI.adicionar({ produtoId: p.id, nome: p.nome, cor: corSel.nome, corHex: corSel.hex, cap: capSel.cap, preco: p.base + capSel.extra });
    trackAddToCart(p, 1, p.base + capSel.extra);
    fecharModal();
  });
}

function atualizarStatusCompraModal() {
  const p = estado.produtoAtual;
  if (!p) return;

  const cor = p.cores[estado.corIndex];
  const cap = p.capacidades[estado.capIndex];
  if (!cor || !cap) return;

  const esgotado = variacaoEsgotada(p, cor.nome, cap.cap);
  const textoUrgencia = textoEstoqueVariacao(p, cor.nome, cap.cap);
  const nivel = nivelEstoqueVariacao(p, cor.nome, cap.cap);

  const btn = document.getElementById('addCarrinho');
  if (btn) {
    if (esgotado) {
      btn.disabled = true;
      btn.textContent = 'Esgotado';
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    } else {
      btn.disabled = false;
      btn.textContent = 'Adicionar à sacola';
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    }
  }

  const divUrgencia = document.getElementById('urgenciaModal');
  if (divUrgencia) {
    if (esgotado) {
      divUrgencia.innerHTML = `<div class="urgencia esgotado"><span class="pulso"></span>Esgotado nessa combinação</div>`;
    } else if (textoUrgencia) {
      divUrgencia.innerHTML = `<div class="urgencia ${nivel}"><span class="pulso"></span>${escapeHTML(textoUrgencia)}</div>`;
    } else {
      divUrgencia.innerHTML = '';
    }
  }
}

function trocarCorNoStack(novaCor) {
  estado.imgIndex = 0;
  const p = estado.produtoAtual;
  const stack = document.getElementById('phoneStack');
  if (!stack || !p.cores) return;
  stack.dataset.cor = novaCor;
  stack.querySelectorAll('.phone-img, .phone-modal-fallback').forEach((el) => {
    const mesmaCor = Number(el.dataset.cor) === novaCor;
    const primeira = Number(el.dataset.img || 0) === 0;
    const ativo = mesmaCor && primeira;
    el.classList.toggle('ativa', ativo);
    if (el.classList.contains('phone-modal-fallback')) el.style.display = ativo ? 'block' : 'none';
  });
  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) {
    const c = p.cores[novaCor];
    const total = (c.imagens && c.imagens.length) || 1;
    dotsEl.innerHTML = Array.from({ length: total }).map((_, i) => `<button class="phone-dot ${i === 0 ? 'ativa' : ''}" type="button" data-img="${i}" aria-label="Ângulo ${i + 1}"></button>`).join('');
  }
}

function trocarAnguloNoStack(novoIndex) {
  estado.imgIndex = novoIndex;
  const stack = document.getElementById('phoneStack');
  if (!stack) return;
  stack.querySelectorAll('.phone-img, .phone-modal-fallback').forEach((el) => {
    const mesmaCor = Number(el.dataset.cor) === estado.corIndex;
    const mesmaImg = Number(el.dataset.img || 0) === novoIndex;
    const ativo = mesmaCor && mesmaImg;
    el.classList.toggle('ativa', ativo);
    if (el.classList.contains('phone-modal-fallback')) el.style.display = ativo ? 'block' : 'none';
  });
  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) dotsEl.querySelectorAll('.phone-dot').forEach((d, i) => d.classList.toggle('ativa', i === novoIndex));
}

function atualizarPrecoModal() {
  const p = estado.produtoAtual;
  const preco = p.base + (p.capacidades[estado.capIndex]?.extra || 0);
  const el = $('#valorModal');
  if (el) { el.textContent = fmt(preco); el.classList.remove('muda'); void el.offsetWidth; el.classList.add('muda'); }
  const parcelaEl = document.querySelector('.modal-preco .parcela strong');
  if (parcelaEl) parcelaEl.textContent = parcela(preco);
}

function fecharModal() {
  modal.classList.remove('aberto'); document.body.classList.remove('travado');
  if (trapModal) { trapModal.release(); trapModal = null; }
}
modal.addEventListener('click', (e) => { if (e.target === modal) fecharModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharModal(); });

/* =========================================================
   RESTO DO CÓDIGO (VISTOS, CUPONS, FAQ, ETC)
   ========================================================= */
function renderVistosRecentemente() {
  const secao = document.getElementById('vistosRecentes');
  if (!secao) return;
  const ids = lerRecentes();
  const produtos = ids.map(acharProduto).filter(Boolean);
  if (produtos.length < 2) { secao.hidden = true; return; }
  secao.hidden = false;
  const gridEl = document.getElementById('gridRecentes');
  if (!gridEl) return;
  gridEl.innerHTML = produtos.map((p) => `<article class="card card-recente" data-id="${escapeHTML(p.id)}"><div class="card-media">${htmlImagemProduto(p, 0)}</div><h3>${escapeHTML(p.nome)}</h3><p class="preco"><strong>${fmt(p.base)}</strong></p></article>`).join('');
  gridEl.querySelectorAll('.card-recente').forEach((card) => card.addEventListener('click', () => abrirModal(card.dataset.id)));
}

const CUPONS_DESTAQUE = [
  { codigo: 'NEWTECH10',   titulo: '10% OFF',      descricao: 'Em qualquer iPhone',  icone: '🏷️', cor: '#0071e3' },
  { codigo: 'BEMVINDO50',  titulo: 'R$ 50 OFF',    descricao: 'Na primeira compra',  icone: '🎁', cor: '#30d158' },
  { codigo: 'FRETEGRATIS', titulo: 'Frete grátis', descricao: 'Em qualquer região',  icone: '🚚', cor: '#ff9500' }
];

function renderCupons() {
  const gridEl = document.getElementById('gridCupons');
  if (!gridEl) return;
  gridEl.innerHTML = CUPONS_DESTAQUE.map((c) => `
    <div class="cupom-card" style="--cor:${escapeHTML(c.cor)}">
      <div class="cupom-icone">${escapeHTML(c.icone)}</div>
      <div class="cupom-info"><span class="cupom-titulo">${escapeHTML(c.titulo)}</span><span class="cupom-desc">${escapeHTML(c.descricao)}</span></div>
      <div class="cupom-codigo"><code>${escapeHTML(c.codigo)}</code><button class="cupom-copiar" type="button" data-codigo="${escapeHTML(c.codigo)}" aria-label="Copiar cupom ${escapeHTML(c.codigo)}">Copiar</button></div>
    </div>
  `).join('');
  gridEl.querySelectorAll('.cupom-copiar').forEach((btn) => btn.addEventListener('click', () => copiarCupom(btn.dataset.codigo, btn)));
}

async function copiarCupom(codigo, btn) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(codigo);
    else {
      const ta = document.createElement('textarea'); ta.value = codigo; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    }
    btn.textContent = '✓ Copiado!'; btn.classList.add('copiado'); toast(`Cupom "${codigo}" copiado!`);
    setTimeout(() => { btn.textContent = 'Copiar'; btn.classList.remove('copiado'); }, 2000);
  } catch (e) { toast('Copie manualmente: ' + codigo); }
}

function renderFAQ() {
  const el = document.getElementById('listaFAQ');
  if (!el) return;
  el.innerHTML = FAQ.map((item) => `<details class="faq-item"><summary class="faq-pergunta"><span>${escapeHTML(item.pergunta)}</span><span class="faq-icone" aria-hidden="true"></span></summary><div class="faq-resposta"><p>${escapeHTML(item.resposta)}</p></div></details>`).join('');
}

function iniciarBannerCupom() {
  const banner = document.getElementById('bannerCupom');
  if (!banner) return;
  if (sessionStorage.getItem('newtech_banner_fechado') === '1') { banner.hidden = true; return; }
  document.getElementById('bannerCupomTexto').textContent = CUPOM_DO_DIA.titulo;
  document.getElementById('bannerCupomBtn').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    try { await navigator.clipboard.writeText(CUPOM_DO_DIA.codigo); btn.textContent = '✓ Copiado!'; setTimeout(() => (btn.textContent = 'Copiar'), 2000); toast(`Cupom "${CUPOM_DO_DIA.codigo}" copiado!`); }
    catch (err) { toast('Copie manualmente: ' + CUPOM_DO_DIA.codigo); }
  });
  document.getElementById('bannerCupomFechar').addEventListener('click', () => { banner.hidden = true; sessionStorage.setItem('newtech_banner_fechado', '1'); });
}

function iniciarNewsletter() {
  const form = document.getElementById('formNewsletter');
  const input = document.getElementById('newsletterEmail');
  const msg = document.getElementById('newsletterMsg');
  if (!form) return;
  const salvo = lerNewsletter();
  if (salvo && salvo.email) { form.innerHTML = `<p class="newsletter-ok">✓ Você já está inscrito com <strong>${escapeHTML(salvo.email)}</strong></p>`; return; }
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!validarEmail(email)) { msg.textContent = 'Digite um e-mail válido.'; msg.className = 'newsletter-msg erro'; input.classList.add('invalido'); return; }
    gravarNewsletter(email); msg.textContent = ''; form.innerHTML = `<p class="newsletter-ok">🎉 Inscrição confirmada! Seu cupom <strong>BEMVINDO50</strong> já está ativo.</p>`; toast('Inscrição confirmada! Use o cupom BEMVINDO50');
  });
}

/* CALCULADORA DE TROCA NA HOME */
const TABELA_TROCA_VALORES = { '14': 3500, '13': 2800, '12': 2000, '11': 1200 };
window.calcularTrocaHome = function() {
  const modelo = document.getElementById('home-troca-modelo').value;
  const estado = document.getElementById('home-troca-estado').value;
  if (!modelo || !estado) { toast('Selecione o modelo e o estado do seu iPhone.'); return; }
  const valorBase = TABELA_TROCA_VALORES[modelo];
  const valorFinal = valorBase * parseFloat(estado);
  document.getElementById('home-troca-valor').textContent = fmt(valorFinal);
  document.getElementById('home-troca-resultado').hidden = false;
};
window.irParaTroca = function() { window.location.href = 'troca.html'; };

function init() {
  renderGrid();
  document.querySelectorAll('.reveal').forEach((el) => observador.observe(el));
  carrinhoUI.render();
  atualizarBadgeFavoritos();
  renderVistosRecentemente();
  renderCupons();
  renderFAQ();
  iniciarBannerCupom();
  iniciarNewsletter();
}

document.addEventListener('produtosProntos', init);
if (typeof PRODUTOS !== 'undefined' && PRODUTOS.length > 0) init();
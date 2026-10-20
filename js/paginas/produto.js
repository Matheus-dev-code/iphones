/* =========================================================
   PÁGINA DO PRODUTO + REVIEWS + FRETE + CROSS-SELL
   ========================================================= */

const params = new URLSearchParams(window.location.search);
const idProduto = params.get('id');
let produto = null;

const paginaEl = document.getElementById('paginaProduto');
const $ = (sel) => document.querySelector(sel);

const estado = {
  corIndex: 0,
  capIndex: 0,
  imgIndex: 0,
  carrinho: lerCarrinho(),
  cupom: lerCupom(),
  favoritos: lerFavoritos(),
  notaNova: 0,
  fotoNova: null,
  lightboxAberto: false,
  filtroReviews: {
    ordenacao: 'recentes',
    notaMinima: 0,
    somenteComFoto: false
  }
};

const CHAVE_REVIEWS_UTEIS = 'newtech_reviews_uteis_v1';

function htmlEstrelas(rating, avaliacoes) {
  const cheias = Math.round(rating);
  const estrelas = [1, 2, 3, 4, 5]
    .map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`)
    .join('');
  const qtd = avaliacoes !== undefined ? `<span class="qtd">(${avaliacoes})</span>` : '';
  return `
    <div class="estrelas" aria-label="${rating.toFixed(1)} de 5 estrelas">
      ${estrelas}
      <span class="nota">${rating.toFixed(1)}</span>
      ${qtd}
    </div>
  `;
}

function formatarDataAntiga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function usuarioJaComprouProduto() {
  const pedidos = lerPedidos();
  const emailAtual = (typeof lerNewsletter === 'function' && lerNewsletter()?.email) || '';
  const emailNormalizado = emailAtual.trim().toLowerCase();

  return pedidos.some((p) => {
    const temProduto = p.itens?.some((item) => item.produtoId === produto.id);
    if (!temProduto) return false;

    if (emailNormalizado && p.cliente?.email) {
      return p.cliente.email.trim().toLowerCase() === emailNormalizado;
    }
    return true;
  });
}

function trocarCorNoStack(novaCor) {
  estado.imgIndex = 0;
  const stack = document.getElementById('phoneStack');
  if (!stack || !produto) return;
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

  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) {
    const c = produto.cores[novaCor];
    const total = (c.imagens && c.imagens.length) || 1;
    dotsEl.innerHTML = Array.from({ length: total }).map((_, i) => `
      <button class="phone-dot ${i === 0 ? 'ativa' : ''}"
              type="button" data-img="${i}"
              aria-label="Ângulo ${i + 1}"></button>
    `).join('');
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
    if (el.classList.contains('phone-modal-fallback')) {
      el.style.display = ativo ? 'block' : 'none';
    }
  });

  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) {
    dotsEl.querySelectorAll('.phone-dot').forEach((d, i) => {
      d.classList.toggle('ativa', i === novoIndex);
    });
  }
}

function initFreteCalc() {
  const input = $('#freteCep');
  const btn = $('#freteCalcular');
  const info = $('#freteInfo');
  if (!input || !btn || !info) return;

  input.addEventListener('input', (e) => {
    e.target.value = mascaraCEP(e.target.value);
    e.target.classList.remove('invalido');
  });

  function calcular() {
    const frete = calcularFrete(input.value);
    if (!frete) {
      input.classList.add('invalido');
      info.hidden = true;
      return;
    }
    input.classList.remove('invalido');
    info.hidden = false;
    info.innerHTML = `
      <span class="regiao">📍 ${escapeHTML(frete.regiao)}</span>
      <span class="prazo">Entrega em até ${frete.prazo} dias úteis</span>
      <span class="valor">${fmt(frete.valor)}</span>
    `;
    track('calcular_frete', { cep_regiao: frete.regiao, valor: frete.valor });
  }

  btn.addEventListener('click', calcular);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); calcular(); }
  });
}

function atualizarUrgenciaVariacao() {
  const el = document.getElementById('urgenciaVariacao');
  const btnAdd = document.getElementById('addCarrinho');
  const stickyBtn = document.getElementById('stickyAddBtn');

  if (!el || !produto) return;

  const cor = produto.cores[estado.corIndex].nome;
  const cap = produto.capacidades[estado.capIndex].cap;

  const nivel = nivelEstoqueVariacao(produto, cor, cap);
  const texto = textoEstoqueVariacao(produto, cor, cap);
  const esgotado = variacaoEsgotada(produto, cor, cap);

  if (btnAdd) {
    if (esgotado) {
      btnAdd.disabled = true;
      btnAdd.textContent = 'Esgotado';
      btnAdd.style.opacity = '0.5';
      btnAdd.style.cursor = 'not-allowed';
    } else {
      btnAdd.disabled = false;
      btnAdd.textContent = 'Adicionar à sacola';
      btnAdd.style.opacity = '1';
      btnAdd.style.cursor = 'pointer';
    }
  }

  if (stickyBtn) {
    if (esgotado) {
      stickyBtn.disabled = true;
      stickyBtn.innerHTML = 'Esgotado';
      stickyBtn.style.opacity = '0.5';
    } else {
      stickyBtn.disabled = false;
      stickyBtn.innerHTML = '🛍️ Adicionar';
      stickyBtn.style.opacity = '1';
    }
  }

  if (!texto && !esgotado) {
    el.innerHTML = '';
    return;
  }

  if (esgotado) {
    el.innerHTML = `<div class="urgencia esgotado"><span class="pulso"></span>Esgotado nessa combinação</div>`;
    return;
  }

  el.innerHTML = `<div class="urgencia ${nivel}"><span class="pulso"></span>${escapeHTML(texto)}</div>`;
}

let stickyCartEl = null;

function criarStickyCart() {
  if (stickyCartEl || !produto) return;

  stickyCartEl = document.createElement('div');
  stickyCartEl.className = 'sticky-cart';
  stickyCartEl.innerHTML = `
    <div class="sticky-cart-inner">
      <div class="sticky-cart-info">
        <span class="sticky-cart-nome" id="stickyNome">${escapeHTML(produto.nome)}</span>
        <span class="sticky-cart-preco" id="stickyPreco">—</span>
      </div>
      <button type="button" class="sticky-cart-btn" id="stickyAddBtn">
        🛍️ Adicionar
      </button>
    </div>
  `;
  document.body.appendChild(stickyCartEl);

  stickyCartEl.querySelector('#stickyAddBtn').addEventListener('click', () => {
    const cor = produto.cores[estado.corIndex];
    const cap = produto.capacidades[estado.capIndex];

    if (variacaoEsgotada(produto, cor.nome, cap.cap)) {
      toast('Essa combinação está esgotada. Escolha outra cor ou capacidade.');
      return;
    }

    adicionar();

    const btn = stickyCartEl.querySelector('#stickyAddBtn');
    btn.classList.add('adicionado');
    btn.innerHTML = '✓ Adicionado';
    setTimeout(() => {
      btn.classList.remove('adicionado');
      btn.innerHTML = '🛍️ Adicionar';
    }, 1800);
  });

  atualizarStickyCart();
}

function atualizarStickyCart() {
  if (!stickyCartEl || !produto) return;
  const preco = produto.base + produto.capacidades[estado.capIndex].extra;
  const precoEl = stickyCartEl.querySelector('#stickyPreco');
  if (precoEl) precoEl.textContent = fmt(preco);
}

function observarScrollSticky() {
  if (!stickyCartEl) return;

  const botaoOriginal = document.getElementById('addCarrinho');
  if (!botaoOriginal) return;

  let agendado = false;
  function verificar() {
    const rect = botaoOriginal.getBoundingClientRect();
    const saiuDaTela = rect.top < 0 || rect.bottom > window.innerHeight;

    if (saiuDaTela && window.innerWidth <= 720) {
      stickyCartEl.classList.add('visivel');
    } else {
      stickyCartEl.classList.remove('visivel');
    }
    agendado = false;
  }

  window.addEventListener('scroll', () => {
    if (!agendado) {
      requestAnimationFrame(verificar);
      agendado = true;
    }
  }, { passive: true });

  window.addEventListener('resize', verificar);
  verificar();
}

function renderPagina() {
  if (!produto) {
    document.title = 'Produto não encontrado — NewTech';
    paginaEl.innerHTML = `
      <div class="erro-produto">
        <h1>Produto não encontrado</h1>
        <p>O produto que você procura não existe ou foi removido.</p>
        <a href="index.html" class="btn-primario">Voltar para a loja</a>
      </div>
    `;
    return;
  }

  registrarVisita(produto.id);
  aplicarSeoProduto(produto);
  trackViewItem(produto);

  const preco = produto.base + produto.capacidades[estado.capIndex].extra;
  const cor = produto.cores[estado.corIndex];

  const imagensStack = produto.cores.map((c, corIdx) => {
    if (!c.imagens && !c.imagem) {
      return `<div class="phone phone-modal-fallback" data-cor="${corIdx}"
                   style="--c:${escapeHTML(c.hex)}; display:${corIdx === estado.corIndex ? 'block' : 'none'}"></div>`;
    }
    const lista = c.imagens || [c.imagem];
    return lista.map((src, imgIdx) => `
      <img src="${escapeHTML(src)}"
           alt="${escapeHTML(produto.nome)} — ${escapeHTML(c.nome)}"
           class="phone-img phone-modal-img"
           data-cor="${corIdx}"
           data-img="${imgIdx}"
           draggable="false">
    `).join('');
  }).join('');

  const totalImagens = (cor.imagens && cor.imagens.length) || 1;
  const dotsHTML = totalImagens > 1
    ? `<div class="phone-dots" id="phoneDots">
         ${Array.from({ length: totalImagens }).map((_, i) => `
           <button class="phone-dot ${i === 0 ? 'ativa' : ''}"
                   type="button" data-img="${i}"
                   aria-label="Ângulo ${i + 1}"></button>
         `).join('')}
       </div>`
    : '';

  paginaEl.innerHTML = `
    <a href="index.html" class="voltar">← Voltar para a loja</a>

    <div class="produto-detalhe">
      <div class="visual">
        <div class="phone-stack" id="phoneStack" data-cor="${estado.corIndex}">
          ${imagensStack}
        </div>
        ${dotsHTML}
      </div>

      <div>
        <h1>${escapeHTML(produto.nome)}</h1>
        ${htmlEstrelas(produto.rating, produto.avaliacoes)}
        <p class="tagline">${escapeHTML(produto.tagline)}</p>
        ${produto.selo ? `<span class="selo-pg">${escapeHTML(produto.selo)}</span>` : ''}

        <p class="opcao-titulo">Cor — <span id="nomeCor">${escapeHTML(cor.nome)}</span></p>
        <div class="cores" id="cores">
          ${produto.cores.map((c, i) => `
            <button class="cor ${i === estado.corIndex ? 'ativa' : ''}"
                    style="background:${escapeHTML(c.hex)}"
                    data-i="${i}" title="${escapeHTML(c.nome)}" aria-label="${escapeHTML(c.nome)}"></button>
          `).join('')}
        </div>

        <p class="opcao-titulo">Armazenamento</p>
        <div class="capacidades" id="capacidades">
          ${produto.capacidades.map((c, i) => `
            <button class="cap ${i === estado.capIndex ? 'ativa' : ''}" data-i="${i}">${escapeHTML(c.cap)}</button>
          `).join('')}
        </div>

        <div id="urgenciaVariacao"></div>

        <div class="modal-preco">
          <div class="valor" id="valorPagina">${fmt(preco)}</div>
          <div class="parcela">ou 12x de<br><strong>${parcela(preco)}</strong></div>
        </div>

        <div class="acoes-produto">
          <button class="btn-primario" id="addCarrinho">Adicionar à sacola</button>
          <button class="btn-compartilhar" id="btnCompartilhar" aria-label="Compartilhar produto" type="button">🔗</button>
          <button class="btn-compartilhar" id="btnQrCode" aria-label="Mostrar QR Code" type="button">📱</button>
        </div>

        <div class="frete-calc">
          <span class="frete-calc-titulo">Calcular frete e prazo</span>
          <div class="frete-calc-linha">
            <input type="text" id="freteCep" placeholder="00000-000" inputmode="numeric" maxlength="9" aria-label="CEP">
            <button type="button" id="freteCalcular">Calcular</button>
          </div>
          <div class="frete-calc-info" id="freteInfo" hidden></div>
        </div>
      </div>
    </div>

    <section class="reviews" id="reviews">
      <div class="reviews-cabecalho">
        <div>
          <h2>Avaliações</h2>
          <p id="reviewsSubtitulo"></p>
        </div>
        <div class="reviews-resumo" id="reviewsResumo"></div>
      </div>

      <div class="reviews-topo-acoes">
        <div class="reviews-filtros" id="reviewsFiltros">
          <select class="reviews-select" id="reviewsOrdenacao" aria-label="Ordenar avaliações">
            <option value="recentes">Mais recentes</option>
            <option value="uteis">Mais úteis</option>
            <option value="maior-nota">Maior nota</option>
            <option value="menor-nota">Menor nota</option>
          </select>

          <button type="button" class="reviews-filtro-btn" data-filtro="foto" id="filtroFoto">
            📷 Com foto
          </button>

          <button type="button" class="reviews-filtro-btn" data-filtro="5" id="filtro5">5 ★</button>
          <button type="button" class="reviews-filtro-btn" data-filtro="4" id="filtro4">4+ ★</button>
          <button type="button" class="reviews-filtro-btn" data-filtro="0" id="filtroTodas">Todas</button>
        </div>

        <button class="reviews-abrir" id="abrirFormReview">✍️ Escrever avaliação</button>
      </div>

      <div class="review-form" id="reviewForm">
        <h3>Compartilhe sua experiência</h3>

        <div class="review-campo">
          <label for="reviewAutor">Seu nome</label>
          <input type="text" id="reviewAutor" placeholder="Como quer aparecer" maxlength="40">
        </div>

        <div class="review-campo">
          <label>Sua nota</label>
          <div class="review-estrelas" id="reviewEstrelas">
            ${[1, 2, 3, 4, 5].map((n) =>
              `<button type="button" data-nota="${n}" aria-label="${n} estrelas">★</button>`
            ).join('')}
          </div>
        </div>

        <div class="review-campo">
          <label for="reviewTexto">Seu comentário</label>
          <textarea id="reviewTexto" placeholder="Conte como foi sua experiência com o produto..." maxlength="400"></textarea>
        </div>

        <div class="review-campo">
          <label>Foto <span class="opcional">(opcional · máx. 200KB)</span></label>
          <div class="review-foto-upload">
            <input type="file" id="reviewFoto" accept="image/*">
            <label for="reviewFoto" class="review-foto-label">📷 Escolher foto</label>
            <img class="review-foto-preview" id="reviewFotoPreview" alt="Prévia da foto">
            <button type="button" class="review-foto-remover" id="reviewFotoRemover">Remover</button>
          </div>
        </div>

        <div class="acoes">
          <button class="btn-review-cancelar" id="cancelarReview" type="button">Cancelar</button>
          <button class="btn-review-enviar" id="enviarReview" type="button">Publicar avaliação</button>
        </div>
      </div>

      <div class="reviews-lista" id="reviewsLista"></div>
    </section>

    <section class="cross-sell" id="crossSell" hidden>
      <h2>Quem viu esse, também viu</h2>
      <p class="lead">Outros iPhones que combinam com o seu perfil.</p>
      <div class="cross-sell-grid" id="crossSellGrid"></div>
    </section>
  `;

  document.getElementById('cores').addEventListener('click', (e) => {
    const btn = e.target.closest('.cor');
    if (!btn) return;
    estado.corIndex = Number(btn.dataset.i);
    document.querySelectorAll('.cor').forEach((el) => el.classList.remove('ativa'));
    btn.classList.add('ativa');
    document.getElementById('nomeCor').textContent = produto.cores[estado.corIndex].nome;
    trocarCorNoStack(estado.corIndex);
    atualizarUrgenciaVariacao();
  });

  const dotsEl = document.getElementById('phoneDots');
  if (dotsEl) {
    dotsEl.addEventListener('click', (e) => {
      const dot = e.target.closest('.phone-dot');
      if (!dot) return;
      trocarAnguloNoStack(Number(dot.dataset.img));
    });
  }

  const stack = document.getElementById('phoneStack');
  if (stack) {
    stack.addEventListener('click', () => {
      const c = produto.cores[estado.corIndex];
      const total = (c.imagens && c.imagens.length) || 1;
      if (total <= 1) return;
      const proximo = (estado.imgIndex + 1) % total;
      trocarAnguloNoStack(proximo);
    });
  }

  document.getElementById('capacidades').addEventListener('click', (e) => {
    const btn = e.target.closest('.cap');
    if (!btn) return;
    estado.capIndex = Number(btn.dataset.i);
    document.querySelectorAll('.cap').forEach((el) => el.classList.remove('ativa'));
    btn.classList.add('ativa');
    atualizarPrecoPagina();
    atualizarStickyCart();
    atualizarUrgenciaVariacao();
  });

  document.getElementById('addCarrinho').addEventListener('click', adicionar);

  document.getElementById('btnCompartilhar').addEventListener('click', () => {
    compartilharProduto(produto);
  });

  document.getElementById('btnQrCode').addEventListener('click', () => {
    abrirModalQRCode(produto);
  });

  document.getElementById('abrirFormReview').addEventListener('click', abrirFormReview);
  document.getElementById('cancelarReview').addEventListener('click', fecharFormReview);
  document.getElementById('enviarReview').addEventListener('click', enviarReview);

  document.getElementById('reviewEstrelas').addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    estado.notaNova = Number(btn.dataset.nota);
    document.querySelectorAll('#reviewEstrelas button').forEach((b, i) => {
      b.classList.toggle('cheia', i < estado.notaNova);
    });
  });

  document.getElementById('reviewsOrdenacao').addEventListener('change', (e) => {
    estado.filtroReviews.ordenacao = e.target.value;
    renderReviews();
  });

  document.getElementById('filtroFoto').addEventListener('click', (e) => {
    estado.filtroReviews.somenteComFoto = !estado.filtroReviews.somenteComFoto;
    e.currentTarget.classList.toggle('ativo', estado.filtroReviews.somenteComFoto);
    renderReviews();
  });

  document.querySelectorAll('[data-filtro="5"], [data-filtro="4"], [data-filtro="0"]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const valor = Number(e.currentTarget.dataset.filtro);
      estado.filtroReviews.notaMinima = valor;

      document.querySelectorAll('[data-filtro="5"], [data-filtro="4"], [data-filtro="0"]').forEach((b) => {
        b.classList.remove('ativo');
      });
      e.currentTarget.classList.add('ativo');
      renderReviews();
    });
  });

  document.getElementById('filtroTodas').classList.add('ativo');

  initUploadFoto();
  initFreteCalc();
  renderReviews();
  renderCrossSell();
  criarStickyCart();
  observarScrollSticky();
  atualizarUrgenciaVariacao();
}

function initUploadFoto() {
  const input = document.getElementById('reviewFoto');
  const preview = document.getElementById('reviewFotoPreview');
  const remover = document.getElementById('reviewFotoRemover');
  if (!input) return;

  const MAX_BYTES = 200 * 1024;

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast('Foto muito grande. Máx. 200KB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      estado.fotoNova = e.target.result;
      preview.src = estado.fotoNova;
      preview.classList.add('visivel');
      remover.classList.add('visivel');
    };
    reader.readAsDataURL(file);
  });

  remover.addEventListener('click', () => {
    estado.fotoNova = null;
    input.value = '';
    preview.src = '';
    preview.classList.remove('visivel');
    remover.classList.remove('visivel');
  });
}

function atualizarPrecoPagina() {
  const preco = produto.base + produto.capacidades[estado.capIndex].extra;
  const el = document.getElementById('valorPagina');
  el.textContent = fmt(preco);
  el.classList.remove('muda');
  void el.offsetWidth;
  el.classList.add('muda');
  document.querySelector('.modal-preco .parcela strong').textContent = parcela(preco);
}

function lerReviewsUteis() {
  try {
    const raw = localStorage.getItem(CHAVE_REVIEWS_UTEIS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function marcarReviewUtil(chave) {
  const uteis = lerReviewsUteis();
  if (uteis[chave]) delete uteis[chave];
  else uteis[chave] = 1;
  try { localStorage.setItem(CHAVE_REVIEWS_UTEIS, JSON.stringify(uteis)); } catch (e) {}
  return !!uteis[chave];
}

function jaMarcouUtil(chave) {
  return !!lerReviewsUteis()[chave];
}

function aplicarFiltrosReviews(reviews) {
  let lista = [...reviews];
  const f = estado.filtroReviews;

  if (f.somenteComFoto) lista = lista.filter((r) => !!r.foto);
  if (f.notaMinima > 0) lista = lista.filter((r) => r.nota >= f.notaMinima);

  if (f.ordenacao === 'recentes') {
    lista.sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
  } else if (f.ordenacao === 'maior-nota') {
    lista.sort((a, b) => b.nota - a.nota);
  } else if (f.ordenacao === 'menor-nota') {
    lista.sort((a, b) => a.nota - b.nota);
  } else if (f.ordenacao === 'uteis') {
    const uteis = lerReviewsUteis();
    lista.sort((a, b) => {
      const chaveA = `${produto.id}_${a.data}_${a.autor}`;
      const chaveB = `${produto.id}_${b.data}_${b.autor}`;
      return (uteis[chaveB] || 0) - (uteis[chaveA] || 0);
    });
  }

  return lista;
}

function renderReviews() {
  if (!produto) return;
  const todas = reviewsDoProduto(produto.id);
  const media = todas.length ? mediaReviews(todas) : produto.rating;

  document.getElementById('reviewsSubtitulo').textContent =
    todas.length === 0
      ? 'Ainda não há avaliações. Seja o primeiro!'
      : `Baseado em ${todas.length} avaliaç${todas.length === 1 ? 'ão' : 'ões'}`;

  const cheias = Math.round(media);
  const estrelasHTML = [1, 2, 3, 4, 5]
    .map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`)
    .join('');

  document.getElementById('reviewsResumo').innerHTML = `
    <div class="reviews-media">${media.toFixed(1)}</div>
    <div class="reviews-media-info">
      <div class="estrelas">${estrelasHTML}</div>
      <span class="qtd">${todas.length} avaliações</span>
    </div>
  `;

  const lista = document.getElementById('reviewsLista');
  const filtradas = aplicarFiltrosReviews(todas);

  if (todas.length === 0) {
    lista.innerHTML = `<p class="reviews-vazio">Nenhuma avaliação ainda. Toque em "Escrever avaliação" para começar.</p>`;
    return;
  }

  if (filtradas.length === 0) {
    lista.innerHTML = `
      <div class="reviews-vazio-filtro">
        <p>😕 Nenhuma avaliação bate com os filtros atuais.</p>
        <button type="button" class="btn-limpar-filtros-reviews" id="limparFiltrosReviews">Limpar filtros</button>
      </div>
    `;
    document.getElementById('limparFiltrosReviews')?.addEventListener('click', () => {
      estado.filtroReviews = { ordenacao: 'recentes', notaMinima: 0, somenteComFoto: false };
      document.getElementById('reviewsOrdenacao').value = 'recentes';
      document.getElementById('filtroFoto').classList.remove('ativo');
      document.querySelectorAll('[data-filtro="5"], [data-filtro="4"], [data-filtro="0"]').forEach((b) => b.classList.remove('ativo'));
      document.getElementById('filtroTodas').classList.add('ativo');
      renderReviews();
    });
    return;
  }

  lista.innerHTML = filtradas.map((r) => {
    const cheias = Math.round(r.nota);
    const estrelas = [1, 2, 3, 4, 5]
      .map((n) => `<span class="star ${n <= cheias ? '' : 'vazia'}">★</span>`)
      .join('');
    const dataTexto = r.data
      ? (r.data.includes('T') ? tempoRelativo(r.data) : formatarDataAntiga(r.data))
      : '';

    const fotoHTML = r.foto
      ? `<img src="${escapeHTML(r.foto)}" class="review-foto" alt="Foto de ${escapeHTML(r.autor)}" loading="lazy" data-lightbox="${escapeHTML(r.foto)}">`
      : '';

    const chaveUtil = `${produto.id}_${r.data}_${r.autor}`;
    const marcado = jaMarcouUtil(chaveUtil);

    const verificadoHTML = r.verificado
      ? `<span class="badge-verificado" title="Avaliação de cliente que comprou este produto">Compra verificada</span>`
      : '';

    return `
      <article class="review-card">
        <div class="topo">
          <span class="autor">
            ${escapeHTML(r.autor)}
            ${verificadoHTML}
          </span>
          <span class="data">${escapeHTML(dataTexto)}</span>
        </div>
        <div class="estrelas">${estrelas}</div>
        <p class="texto">${escapeHTML(r.texto)}</p>
        ${fotoHTML}
        <div class="review-acoes">
          <button type="button" class="review-util ${marcado ? 'marcado' : ''}"
                  data-chave="${escapeHTML(chaveUtil)}"
                  aria-label="Marcar como útil">
            👍 Útil
          </button>
        </div>
      </article>
    `;
  }).join('');

  lista.querySelectorAll('[data-lightbox]').forEach((img) => {
    img.addEventListener('click', () => abrirLightbox(img.dataset.lightbox));
  });

  lista.querySelectorAll('.review-util').forEach((btn) => {
    btn.addEventListener('click', () => {
      const marcado = marcarReviewUtil(btn.dataset.chave);
      btn.classList.toggle('marcado', marcado);
      if (marcado) toast('👍 Marcado como útil');
    });
  });
}

function abrirLightbox(src) {
  let box = document.getElementById('lightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'lightbox';
    box.className = 'lightbox';
    box.innerHTML = `
      <button class="lightbox-fechar" aria-label="Fechar">✕</button>
      <img alt="Foto ampliada">
    `;
    document.body.appendChild(box);

    box.addEventListener('click', (e) => {
      if (e.target === box || e.target.classList.contains('lightbox-fechar')) fecharLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fecharLightbox();
    });
  }
  box.querySelector('img').src = src;
  box.classList.add('aberto');
  estado.lightboxAberto = true;
}

function fecharLightbox() {
  const box = document.getElementById('lightbox');
  if (box) box.classList.remove('aberto');
  estado.lightboxAberto = false;
}

function abrirFormReview() {
  document.getElementById('reviewForm').classList.add('aberto');
  document.getElementById('reviewAutor').focus();

  const salvo = lerNewsletter();
  if (salvo && salvo.email) {
    const autor = document.getElementById('reviewAutor');
    if (autor && !autor.value) {
      autor.value = salvo.email.split('@')[0];
    }
  }
}

function fecharFormReview() {
  document.getElementById('reviewForm').classList.remove('aberto');
  document.getElementById('reviewAutor').value = '';
  document.getElementById('reviewTexto').value = '';
  estado.notaNova = 0;
  estado.fotoNova = null;
  document.querySelectorAll('#reviewEstrelas button').forEach((b) => b.classList.remove('cheia'));
  const preview = document.getElementById('reviewFotoPreview');
  const remover = document.getElementById('reviewFotoRemover');
  const input = document.getElementById('reviewFoto');
  if (preview) { preview.src = ''; preview.classList.remove('visivel'); }
  if (remover) remover.classList.remove('visivel');
  if (input) input.value = '';
}

function enviarReview() {
  const autor = document.getElementById('reviewAutor').value.trim();
  const texto = document.getElementById('reviewTexto').value.trim();
  const nota = estado.notaNova;

  if (!autor) { toast('Digite seu nome.'); return; }
  if (nota < 1) { toast('Escolha uma nota de 1 a 5 estrelas.'); return; }
  if (texto.length < 10) { toast('Conte um pouco mais (mín. 10 caracteres).'); return; }

  const verificado = usuarioJaComprouProduto();

  adicionarReview(produto.id, {
    autor, nota, texto,
    foto: estado.fotoNova || null,
    verificado,
    data: new Date().toISOString()
  });

  fecharFormReview();
  renderReviews();
  toast(verificado
    ? '✓ Avaliação publicada! Marcada como compra verificada.'
    : '✓ Avaliação publicada! Obrigado.'
  );
  track('review_enviada', { produto: produto.id, nota, verificado });
}

function renderCrossSell() {
  const secao = document.getElementById('crossSell');
  const gridEl = document.getElementById('crossSellGrid');
  if (!secao || !gridEl || !produto) return;

  const recentes = lerRecentes().filter((id) => id !== produto.id);
  const mesmaCategoria = PRODUTOS
    .filter((p) => p.id !== produto.id && p.categoria === produto.categoria)
    .map((p) => p.id);

  const idsFinal = [...new Set([...recentes, ...mesmaCategoria])].slice(0, 3);
  const sugestoes = idsFinal.map(acharProduto).filter(Boolean);

  if (sugestoes.length === 0) { secao.hidden = true; return; }

  secao.hidden = false;
  gridEl.innerHTML = sugestoes.map((p) => `
    <article class="card card-recente" data-id="${escapeHTML(p.id)}">
      <div class="card-media">${htmlImagemProduto(p, 0)}</div>
      <h3>${escapeHTML(p.nome)}</h3>
      <p class="preco"><strong>${fmt(p.base)}</strong></p>
    </article>
  `).join('');

  gridEl.querySelectorAll('.card-recente').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.href = `produto.html?id=${encodeURIComponent(card.dataset.id)}`;
    });
  });
}

function adicionar() {
  const cor = produto.cores[estado.corIndex];
  const cap = produto.capacidades[estado.capIndex];

  if (variacaoEsgotada(produto, cor.nome, cap.cap)) {
    toast('Essa combinação está esgotada. Escolha outra cor ou capacidade.');
    return;
  }

  const preco = produto.base + cap.extra;

  carrinhoUI.adicionar({
    produtoId: produto.id,
    nome: produto.nome,
    cor: cor.nome,
    corHex: cor.hex,
    cap: cap.cap,
    preco
  });

  trackAddToCart(produto, 1, preco);
}

const carrinhoUI = iniciarCarrinhoUI(estado);

function iniciarBannerCupom() {
  const banner = document.getElementById('bannerCupom');
  if (!banner) return;

  if (sessionStorage.getItem('newtech_banner_fechado') === '1') {
    banner.hidden = true;
    return;
  }

  const textoEl = document.getElementById('bannerCupomTexto');
  if (textoEl) textoEl.textContent = CUPOM_DO_DIA.titulo;

  const btnCopiar = document.getElementById('bannerCupomBtn');
  if (btnCopiar) {
    btnCopiar.addEventListener('click', async (e) => {
      try {
        await navigator.clipboard.writeText(CUPOM_DO_DIA.codigo);
        e.currentTarget.textContent = '✓ Copiado!';
        setTimeout(() => (e.currentTarget.textContent = 'Copiar'), 2000);
        toast(`Cupom "${CUPOM_DO_DIA.codigo}" copiado!`);
      } catch (err) {
        toast('Copie manualmente: ' + CUPOM_DO_DIA.codigo);
      }
    });
  }

  const btnFechar = document.getElementById('bannerCupomFechar');
  if (btnFechar) {
    btnFechar.addEventListener('click', () => {
      banner.hidden = true;
      sessionStorage.setItem('newtech_banner_fechado', '1');
    });
  }
}

carrinhoUI.render();
iniciarBannerCupom();

function carregarPaginaProduto() {
  produto = acharProduto(idProduto);
  if (produto) {
    renderPagina();
  }
}

document.addEventListener('produtosProntos', carregarPaginaProduto);
if (typeof PRODUTOS !== 'undefined' && PRODUTOS.length > 0) {
  carregarPaginaProduto();
}
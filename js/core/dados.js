/* =========================================================
   DADOS COMPARTILHADOS (Buscando do Supabase)
   ========================================================= */

const SUPABASE_URL = 'https://pedsjjpglxbexbqoxjfa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UjtrpsntYlJ7NIU-eShHqQ_MF_p_emo';

let PRODUTOS = [];
let CUPONS = {};

async function carregarProdutosDoBanco() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/produtos?select=*`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();

    PRODUTOS = data.map(p => {
      const info = p.infos_completas || {};
      return {
        rating: 5.0, avaliacoes: 0, tagline: 'Produto de alta qualidade.', specs: {}, categoria: 'todos',
        ...info,
        id: p.id, nome: p.nome, base: p.preco_base,
        cores: info.cores || [], capacidades: p.variacoes || info.capacidades || []
      };
    });

    document.dispatchEvent(new Event('produtosProntos'));
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
  }
}

async function carregarCuponsDoBanco() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/cupons?select=*&ativo=eq.true`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();

    CUPONS = {};
    const hoje = new Date().toISOString().split('T')[0];

    data.forEach(c => {
      if (c.validade && c.validade < hoje) return;

      CUPONS[c.codigo.toUpperCase()] = {
        tipo: c.tipo,
        valor: c.valor,
        descricao: c.tipo === 'percentual' ? `${c.valor}% de desconto` :
                   c.tipo === 'fixo' ? `R$ ${c.valor} de desconto` : 'Frete grátis'
      };
    });

    document.dispatchEvent(new Event('cuponsProntos'));
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
  }
}

carregarProdutosDoBanco();
carregarCuponsDoBanco();

const REVIEWS_EXEMPLO = {
  '18-pro': [{ autor: 'Marina S.',  nota: 5, data: '2025-09-15', texto: 'Câmera impressionante! A cor Bordo é ainda mais bonita ao vivo. Vale cada centavo.' }],
  '17-pro-max': [{ autor: 'Bruno A.',   nota: 5, data: '2025-07-10', texto: 'Zoom óptico é absurdo. Melhor iPhone que já tive.' }],
  '17': [{ autor: 'Paulo R.',   nota: 5, data: '2025-05-12', texto: 'Tela de 6,3" ficou perfeita. Chip A19 voa em qualquer app.' }],
  '16': [{ autor: 'Fernanda',   nota: 4, data: '2025-03-18', texto: 'Ótimo aparelho pra quem quer entrar no ecossistema sem gastar muito.' }]
};

const CORES_HERO = [
  { c1: '#6b2c40', c2: '#4a1e2f', c3: '#2a0d18', c4: '#3d1727', c5: '#582536' },
  { c1: '#cfc8bd', c2: '#a59d92', c3: '#6b655c', c4: '#8e877d', c5: '#bab2a6' },
  { c1: '#6a7a8a', c2: '#4a5a6a', c3: '#1e2a36', c4: '#3a4a5a', c5: '#5a6a7a' },
  { c1: '#4a4a4e', c2: '#2f2f33', c3: '#121215', c4: '#25252a', c5: '#3a3a40' }
];

const fmt = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
const parcela = (n) => fmt(n / 12);
const acharProduto = (id) => PRODUTOS.find((p) => p.id === id) || null;

function escapeHTML(txt) {
  return String(txt ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const ORDENACOES = {
  'relevancia':     { label: 'Relevância',      fn: null },
  'menor-preco':    { label: 'Menor preço',     fn: (a, b) => a.base - b.base },
  'maior-preco':    { label: 'Maior preço',     fn: (a, b) => b.base - a.base },
  'melhor-avaliado':{ label: 'Melhor avaliado', fn: (a, b) => (b.rating || 0) - (a.rating || 0) },
  'novidades':      { label: 'Novidades',       fn: (a, b) => (b.novidade || 0) - (a.novidade || 0) },
  'mais-avaliado':  { label: 'Mais avaliados',  fn: (a, b) => (b.avaliacoes || 0) - (a.avaliacoes || 0) }
};

function ordenarLista(lista, chave) {
  const ord = ORDENACOES[chave];
  if (!ord || !ord.fn) return lista;
  return [...lista].sort(ord.fn);
}

function acharCupom(codigo) {
  if (!codigo) return null;
  return CUPONS[String(codigo).toUpperCase().trim()] || null;
}

function calcularDesconto(cupom, subtotal) {
  if (!cupom) return 0;
  if (cupom.tipo === 'percentual') return subtotal * (cupom.valor / 100);
  if (cupom.tipo === 'fixo')       return Math.min(cupom.valor, subtotal);
  return 0;
}
function cupomDaFreteGratis(cupom) { return cupom && cupom.tipo === 'frete'; }

const FRETE_GRATIS_VALOR = 500;
const COMPARAR_MAX = 3;
const PRECO_MIN = 3000;
const PRECO_MAX = 20000;
const CUPOM_AUTO_PRIMEIRA_COMPRA = 'BEMVINDO50';
const ESTOQUE_BAIXO = 5;

function nivelEstoque(produto) { const est = produto.estoque ?? 999; if (est <= 2) return 'alerta'; if (est <= ESTOQUE_BAIXO) return 'aviso'; return null; }
function textoEstoque(produto) { const est = produto.estoque ?? null; if (est === null || est > ESTOQUE_BAIXO) return null; if (est <= 2) return `Últimas ${est} unidades!`; return `Apenas ${est} em estoque`; }
function _chaveVariacao(corNome, capNome) { return `${corNome}|${capNome}`; }

function estoqueDaVariacao(produto, corNome, capNome) {
  if (!produto) return null;
  const chave = _chaveVariacao(corNome, capNome);
  if (produto.estoqueVariacoes && chave in produto.estoqueVariacoes) return produto.estoqueVariacoes[chave];
  return produto.estoque ?? null;
}
function nivelEstoqueVariacao(produto, corNome, capNome) {
  const est = estoqueDaVariacao(produto, corNome, capNome);
  if (est === null) return null;
  if (est <= 0) return 'esgotado';
  if (est <= 2) return 'alerta';
  if (est <= ESTOQUE_BAIXO) return 'aviso';
  return null;
}
function textoEstoqueVariacao(produto, corNome, capNome) {
  const est = estoqueDaVariacao(produto, corNome, capNome);
  if (est === null) return null;
  if (est <= 0) return 'Esgotado nessa combinação';
  if (est > ESTOQUE_BAIXO) return null;
  if (est <= 2) return `Últimas ${est} unidades!`;
  return `Apenas ${est} em estoque`;
}
function variacaoEsgotada(produto, corNome, capNome) { const est = estoqueDaVariacao(produto, corNome, capNome); return est !== null && est <= 0; }

function calcularFrete(cep) {
  const num = String(cep || '').replace(/\D/g, '');
  if (num.length !== 8) return null;
  const d = parseInt(num[0], 10);
  let regiao, valor, prazo;
  if (d <= 1)      { regiao = 'São Paulo';                 valor = 19.90; prazo = 2; }
  else if (d <= 3) { regiao = 'Rio de Janeiro / ES / MG';  valor = 24.90; prazo = 3; }
  else if (d <= 6) { regiao = 'Nordeste / Norte';          valor = 34.90; prazo = 6; }
  else if (d === 7) { regiao = 'Centro-Oeste';             valor = 29.90; prazo = 5; }
  else             { regiao = 'Sul';                       valor = 24.90; prazo = 3; }
  return { regiao, valor, prazo, cep: num };
}

const CHAVE_CARRINHO       = 'newtech_carrinho_v1';
const CHAVE_CUPOM          = 'newtech_cupom_v1';
const CHAVE_TROCA          = 'newtech_troca_v1';
const CHAVE_FAVORITOS      = 'newtech_favoritos_v1';
const CHAVE_REVIEWS        = 'newtech_reviews_v1';
const CHAVE_RECENTES       = 'newtech_recentes_v1';
const CHAVE_PEDIDOS        = 'newtech_pedidos_v2';
const CHAVE_PEDIDO_ANTIGO  = 'newtech_pedido_v1';
const CHAVE_NEWSLETTER     = 'newtech_newsletter_v1';
const CHAVE_COMPARAR       = 'newtech_comparar_v1';
const CHAVE_PRIMEIRA_VISITA = 'newtech_primeira_visita_v1';

function lerCarrinho() { try { const raw = localStorage.getItem(CHAVE_CARRINHO); if (!raw) return []; const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
function gravarCarrinho(itens) { try { localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens)); } catch (e) {} }
function limparCarrinhoSalvo() { try { localStorage.removeItem(CHAVE_CARRINHO); } catch (e) {} }

function lerCupom() { try { const raw = localStorage.getItem(CHAVE_CUPOM); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function gravarCupom(cupom) { try { if (cupom) localStorage.setItem(CHAVE_CUPOM, JSON.stringify(cupom)); else localStorage.removeItem(CHAVE_CUPOM); } catch (e) {} }

function lerTroca() { try { const raw = localStorage.getItem(CHAVE_TROCA); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function gravarTroca(troca) { try { if (troca) localStorage.setItem(CHAVE_TROCA, JSON.stringify(troca)); else localStorage.removeItem(CHAVE_TROCA); } catch (e) {} }

function migrarPedidos() {
  try {
    const antigo = localStorage.getItem(CHAVE_PEDIDO_ANTIGO);
    const novo = localStorage.getItem(CHAVE_PEDIDOS);
    if (antigo && !novo) {
      const obj = JSON.parse(antigo);
      localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify([obj]));
      localStorage.removeItem(CHAVE_PEDIDO_ANTIGO);
    }
  } catch (e) {}
}
function lerPedidos() {
  migrarPedidos();
  try { const raw = localStorage.getItem(CHAVE_PEDIDOS); if (!raw) return []; const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch (e) { return []; }
}
function gravarPedidos(arr) { try { localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(arr)); } catch (e) {} }
function adicionarPedido(pedido) { const atuais = lerPedidos(); atuais.unshift(pedido); gravarPedidos(atuais); return pedido; }
function ultimoPedido() { return lerPedidos()[0] || null; }
function acharPedido(numero) { return lerPedidos().find((p) => p.numero === numero) || null; }
function limparPedidos() { try { localStorage.removeItem(CHAVE_PEDIDOS); } catch (e) {} }
function lerPedido() { return ultimoPedido(); }

function lerFavoritos() { try { const raw = localStorage.getItem(CHAVE_FAVORITOS); if (!raw) return []; const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
function gravarFavoritos(ids) { try { localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(ids)); } catch (e) {} }
function ehFavorito(id) { return lerFavoritos().includes(id); }
function alternarFavorito(id) {
  const atuais = lerFavoritos(); const idx = atuais.indexOf(id);
  if (idx >= 0) atuais.splice(idx, 1); else atuais.push(id);
  gravarFavoritos(atuais); return atuais.includes(id);
}

function lerReviewsSalvas() { try { const raw = localStorage.getItem(CHAVE_REVIEWS); return raw ? JSON.parse(raw) : {}; } catch (e) { return {}; } }
function gravarReviewsSalvas(obj) { try { localStorage.setItem(CHAVE_REVIEWS, JSON.stringify(obj)); } catch (e) {} }
function reviewsDoProduto(produtoId) { const salvas = lerReviewsSalvas(); const proprias = salvas[produtoId] || []; const exemplo = REVIEWS_EXEMPLO[produtoId] || []; return [...proprias, ...exemplo]; }
function adicionarReview(produtoId, review) {
  const salvas = lerReviewsSalvas(); if (!salvas[produtoId]) salvas[produtoId] = []; salvas[produtoId].unshift(review); gravarReviewsSalvas(salvas); return salvas[produtoId];
}
function mediaReviews(reviews) { if (!reviews.length) return 0; const soma = reviews.reduce((s, r) => s + r.nota, 0); return soma / reviews.length; }

function lerRecentes() { try { const raw = localStorage.getItem(CHAVE_RECENTES); if (!raw) return []; const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
function gravarRecentes(ids) { try { localStorage.setItem(CHAVE_RECENTES, JSON.stringify(ids)); } catch (e) {} }
function registrarVisita(produtoId) { const atuais = lerRecentes().filter((id) => id !== produtoId); atuais.unshift(produtoId); gravarRecentes(atuais.slice(0, 6)); }

function lerComparando() { try { const raw = localStorage.getItem(CHAVE_COMPARAR); if (!raw) return []; const d = JSON.parse(raw); return Array.isArray(d) ? d : []; } catch (e) { return []; } }
function gravarComparando(ids) { try { localStorage.setItem(CHAVE_COMPARAR, JSON.stringify(ids)); } catch (e) {} }

function lerNewsletter() { try { const raw = localStorage.getItem(CHAVE_NEWSLETTER); return raw ? JSON.parse(raw) : null; } catch (e) { return null; } }
function gravarNewsletter(email) { try { localStorage.setItem(CHAVE_NEWSLETTER, JSON.stringify({ email, data: new Date().toISOString() })); } catch (e) {} }

function ehPrimeiraVisita() { try { return !localStorage.getItem(CHAVE_PRIMEIRA_VISITA); } catch (e) { return false; } }
function marcarVisitaFeita() { try { localStorage.setItem(CHAVE_PRIMEIRA_VISITA, new Date().toISOString()); } catch (e) {} }

function totalCarrinho(itens) { return itens.reduce((s, i) => s + i.preco * i.qtd, 0); }
function qtdCarrinho(itens) { return itens.reduce((s, i) => s + i.qtd, 0); }
function adicionarItem(itens, novo) {
  const ex = itens.find((i) => i.produtoId === novo.produtoId && i.cor === novo.cor && i.cap === novo.cap);
  if (ex) ex.qtd += 1; else itens.push({ ...novo, qtd: 1 }); return itens;
}

function mascaraCEP(v) { return String(v || '').replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'); }
function mascaraTelefone(v) {
  const n = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (n.length === 0)  return '';
  if (n.length <= 2)   return `(${n}`;
  if (n.length <= 6)   return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10)  return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}
function validarEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim()); }
function tempoRelativo(isoData) {
  const agora = Date.now(); const antes = new Date(isoData).getTime(); const diffSeg = Math.floor((agora - antes) / 1000);
  if (diffSeg < 60)       return 'agora mesmo';
  if (diffSeg < 3600)     return `há ${Math.floor(diffSeg / 60)} min`;
  if (diffSeg < 86400)    return `há ${Math.floor(diffSeg / 3600)} h`;
  if (diffSeg < 2592000)  return `há ${Math.floor(diffSeg / 86400)} dias`;
  if (diffSeg < 31536000) return `há ${Math.floor(diffSeg / 2592000)} meses`;
  return `há ${Math.floor(diffSeg / 31536000)} anos`;
}

const FAQ = [
  { pergunta: 'Qual o prazo de entrega?', resposta: 'Depende da sua região. Em São Paulo entregamos em até 2 dias úteis; nas capitais, até 4; demais regiões, até 8 dias úteis. Você vê o prazo exato ao digitar seu CEP no checkout.' },
  { pergunta: 'Os produtos são originais e lacrados?', resposta: 'Sim! Todos os iPhones são originais, lacrados de fábrica, com nota fiscal e 12 meses de garantia Apple. Emitimos nota fiscal em nome do comprador.' },
  { pergunta: 'Como funcionam os cupons de desconto?', resposta: 'Digite o código no carrinho (ou use o botão "Copiar" nos cupons aqui do site) e clique em Aplicar. O desconto aparece na hora. Você pode usar um cupom por pedido.' },
  { pergunta: 'Quais formas de pagamento vocês aceitam?', resposta: 'Pagamento na entrega em dinheiro, Pix, débito ou crédito. Nossos entregadores levam a maquininha e aceitam todas as formas.' },
  { pergunta: 'Posso trocar ou devolver o produto?', resposta: 'Sim. Você tem 7 dias corridos após receber para solicitar troca ou devolução, sem precisar justificar. Devolvemos 100% do valor pago.' },
  { pergunta: 'Vocês entregam em todo o Brasil?', resposta: 'Sim! Entregamos em todos os estados brasileiros. Para a região Norte, o prazo pode ser um pouco maior (até 10 dias úteis), mas chega com segurança.' }
];

const CUPOM_DO_DIA = { codigo: 'NEWTECH10', titulo: 'Use NEWTECH10 e ganhe 10% OFF' };

function destacarTermo(texto, termo) {
  if (!termo) return escapeHTML(texto);
  const seguro = String(termo).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${seguro})`, 'gi');
  return escapeHTML(texto).replace(regex, '<mark>$1</mark>');
}

function htmlImagemProduto(produto, corIndex = 0, classeExtra = '') {
  const cor = produto.cores && produto.cores[corIndex] ? produto.cores[corIndex] : null;
  const primeira = cor && ((cor.imagens && cor.imagens[0]) || cor.imagem);
  if (primeira) {
    return `<img src="${escapeHTML(primeira)}" alt="${escapeHTML(produto.nome)} — ${escapeHTML(cor.nome)}" class="phone-img ${classeExtra}" loading="lazy" draggable="false">`;
  }
  return `<div class="phone ${classeExtra}" style="--c:${escapeHTML(cor ? cor.hex : '#3a3a3c')}"></div>`;
}
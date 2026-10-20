import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pedsjjpglxbexbqoxjfa.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_UjtrpsntYlJ7NIU-eShHqQ_MF_p_emo';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const EMAILJS_PUBLIC_KEY = 'RKbjD4ohAKvPoClQK';
const EMAILJS_SERVICE_ID = 'service_rxrm7sa';
const EMAILJS_TEMPLATE_ID = 'template_iz03sjj';

if (typeof emailjs !== 'undefined') emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const $ = (sel) => document.querySelector(sel);
const carrinho = lerCarrinho();
const cupom = lerCupom();
const troca = lerTroca();

if (carrinho.length === 0) window.location.replace('index.html');
const estado = { frete: null };

function renderResumo() {
  const itensEl = $('#resumoItens');
  itensEl.innerHTML = carrinho.map((item) => `
    <div class="resumo-item">
      <div class="item-mini" style="--c:${escapeHTML(item.corHex)}"></div>
      <div class="resumo-item-info">
        <strong>${escapeHTML(item.nome)}${item.qtd > 1 ? ` ×${item.qtd}` : ''}</strong>
        <span>${escapeHTML(item.cor)} · ${escapeHTML(item.cap)}</span>
      </div>
      <div class="resumo-item-preco">${fmt(item.preco * item.qtd)}</div>
    </div>
  `).join('');
  atualizarValores();
}

function atualizarValores() {
  const subtotal = totalCarrinho(carrinho);
  const descontoCupom = calcularDesconto(cupom, subtotal);
  const descontoTroca = troca ? troca.valor : 0;
  let freteValor = 0;
  let freteConhecido = false;

  if (estado.frete) {
    freteConhecido = true;
    freteValor = estado.frete.valor;
    if (cupomDaFreteGratis(cupom)) freteValor = 0;
  }

  const total = Math.max(0, subtotal - descontoCupom - descontoTroca + freteValor);
  $('#resumoSubtotal').textContent = fmt(subtotal);

  if (descontoCupom > 0) {
    $('#resumoLinhaDesconto').hidden = false;
    $('#resumoDesconto').textContent = `− ${fmt(descontoCupom)}`;
  } else {
    $('#resumoLinhaDesconto').hidden = true;
  }

  if (descontoTroca > 0) {
    $('#resumoLinhaTroca').hidden = false;
    $('#resumoTextoTroca').textContent = `Entrada do seu iPhone ${troca.modelo}`;
    $('#resumoTroca').textContent = `− ${fmt(descontoTroca)}`;
  } else {
    $('#resumoLinhaTroca').hidden = true;
  }

  if (freteConhecido) {
    $('#resumoLinhaFrete').hidden = false;
    $('#resumoFrete').textContent = freteValor === 0 ? 'Grátis' : fmt(freteValor);
    $('#resumoFrete').style.color = freteValor === 0 ? '#30d158' : '';
  } else {
    $('#resumoLinhaFrete').hidden = true;
  }

  $('#resumoTotal').textContent = fmt(total);
}

const cepInput = $('#cep');
const telefoneInput = $('#telefone');
cepInput.addEventListener('input', (e) => { e.target.value = mascaraCEP(e.target.value); });
cepInput.addEventListener('blur', () => {
  const frete = calcularFrete(cepInput.value);
  const infoEl = $('#infoFrete');
  const erroEl = $('#erroCep');
  if (cepInput.value.trim() === '') { infoEl.hidden = true; return; }
  if (!frete) {
    cepInput.classList.add('invalido'); erroEl.hidden = false; infoEl.hidden = true;
    estado.frete = null; atualizarValores(); return;
  }
  cepInput.classList.remove('invalido'); erroEl.hidden = true;
  estado.frete = frete; infoEl.hidden = false;
  infoEl.textContent = `📍 ${frete.regiao} · entrega em até ${frete.prazo} dias úteis`;
  atualizarValores();
});
telefoneInput.addEventListener('input', (e) => { e.target.value = mascaraTelefone(e.target.value); });

function mostrarErro(idErro, input) { const el = document.getElementById(idErro); if (el) el.hidden = false; if (input) input.classList.add('invalido'); }
function limparErro(idErro, input) { const el = document.getElementById(idErro); if (el) el.hidden = true; if (input) input.classList.remove('invalido'); }

function validarFormulario() {
  let valido = true;
  const nome = $('#nome'), email = $('#email'), telefone = $('#telefone'), cep = $('#cep');
  const endereco = $('#endereco'), numero = $('#numero'), bairro = $('#bairro');
  const cidade = $('#cidade'), estadoInput = $('#estado');

  if (nome.value.trim().length < 3) { mostrarErro('erroNome', nome); valido = false; } else limparErro('erroNome', nome);
  if (!validarEmail(email.value)) { mostrarErro('erroEmail', email); valido = false; } else limparErro('erroEmail', email);
  if (telefone.value.replace(/\D/g, '').length < 10) { mostrarErro('erroTelefone', telefone); valido = false; } else limparErro('erroTelefone', telefone);
  if (!estado.frete) { mostrarErro('erroCep', cep); valido = false; } else limparErro('erroCep', cep);

  [[endereco, 'erroEndereco'], [numero, null], [bairro, null], [cidade, null], [estadoInput, null]].forEach(([input, idErro]) => {
    if (!input.value.trim()) { input.classList.add('invalido'); if (idErro) mostrarErro(idErro, input); valido = false; }
    else { input.classList.remove('invalido'); if (idErro) limparErro(idErro, input); }
  });
  return valido;
}

document.querySelectorAll('.campo input').forEach((input) => {
  input.addEventListener('input', () => {
    input.classList.remove('invalido');
    const erro = input.parentElement.querySelector('.erro');
    if (erro) erro.hidden = true;
  });
});

$('#formCheckout').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validarFormulario()) {
    const primeiro = document.querySelector('.campo input.invalido');
    if (primeiro) { primeiro.focus(); primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    toast('Verifique os campos destacados.'); return;
  }

  const btnFinalizar = $('#btnFinalizar');
  btnFinalizar.disabled = true; btnFinalizar.textContent = 'Verificando segurança...';

  const numero = 'NT-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
  const subtotalLocal = totalCarrinho(carrinho);
  const descontoLocal = calcularDesconto(cupom, subtotalLocal);
  let freteLocal = estado.frete ? estado.frete.valor : 0;
  if (cupomDaFreteGratis(cupom)) freteLocal = 0;

  // Adicionado o campo 'nome' aqui
  const dadosCliente = {
    nome: $('#nome').value.trim(),
    email: $('#email').value.trim(), 
    telefone: $('#telefone').value.trim(),
    cep: $('#cep').value.trim(), 
    endereco: $('#endereco').value.trim(),
    numero: $('#numero').value.trim(), 
    complemento: $('#complemento').value.trim() || 'Nenhum',
    bairro: $('#bairro').value.trim(), 
    cidade: $('#cidade').value.trim(), 
    estado: $('#estado').value.trim().toUpperCase()
  };

  const itensParaValidar = carrinho.map(item => ({ produtoId: item.produtoId, cor: item.cor, cap: item.cap, qtd: item.qtd }));

  try {
    const { data, error } = await supabase.functions.invoke('validar-pedido', {
      body: { itens: itensParaValidar, numero_pedido: numero, cliente: dadosCliente, troca: troca },
    });

    if (error) throw error;

    const totalSeguro = data.total;
    const itensTexto = carrinho.map(item => `${item.qtd}x ${item.nome} (${item.cor} / ${item.cap}) - ${fmt(item.preco * item.qtd)}`).join('\n');

    // Adicionado cliente_nome no e-mail
    const templateParams = {
      pedido_numero: numero, 
      cliente_nome: dadosCliente.nome,
      cliente_email: dadosCliente.email, 
      cliente_telefone: dadosCliente.telefone,
      cliente_endereco: dadosCliente.endereco, 
      cliente_numero: dadosCliente.numero, 
      cliente_bairro: dadosCliente.bairro,
      cliente_cidade: dadosCliente.cidade, 
      cliente_estado: dadosCliente.estado, 
      cliente_complemento: dadosCliente.complemento,
      pedido_total: fmt(totalSeguro), 
      pedido_itens: itensTexto,
      pedido_troca: troca ? `Sim, iPhone ${troca.modelo} (${troca.detalhes.tela}) - Abatimento: ${fmt(troca.valor)}` : 'Nenhuma'
    };

    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);

    const pedido = {
      numero, data: new Date().toISOString(), itens: carrinho, cupom: cupom || null,
      subtotal: subtotalLocal, descontoCupom: descontoLocal,
      frete: estado.frete ? { regiao: estado.frete.regiao, prazo: estado.frete.prazo, valor: freteLocal } : null,
      total: totalSeguro, pagamento: 'entrega', status: 'pendente', troca: troca || null, cliente: dadosCliente
    };

    adicionarPedido(pedido); trackPurchase(pedido);
    gravarCarrinho([]); gravarCupom(null); gravarTroca(null);

    toast('✅ Pedido validado e e-mail enviado!');
    window.location.href = 'pedido.html';

  } catch (error) {
    console.error('Falha na validação:', error);
    let msgErro = 'Erro desconhecido.';
    if (error.context && typeof error.context.json === 'function') {
      try { const det = await error.context.json(); msgErro = det.error || msgErro; } catch (e) {}
    }
    toast(`❌ ${msgErro}`);
    btnFinalizar.disabled = false; btnFinalizar.textContent = 'Confirmar pedido';
  }
});

renderResumo();
atualizarValores();
if (typeof trackBeginCheckout === 'function') trackBeginCheckout(carrinho, totalCarrinho(carrinho));
/* =========================================================
   CARRINHO ABANDONADO — banner de retorno
   ========================================================= */

const CHAVE_ABANDONO = 'newtech_carrinho_abandonado_v1';
const TEMPO_MINIMO_MS = 30 * 60 * 1000;

function registrarSnapshotCarrinho() {
  const carrinho = lerCarrinho();
  if (carrinho.length === 0) {
    try { localStorage.removeItem(CHAVE_ABANDONO); } catch (e) {}
    return;
  }
  try {
    localStorage.setItem(CHAVE_ABANDONO, JSON.stringify({
      itens: carrinho,
      total: totalCarrinho(carrinho),
      qtd: qtdCarrinho(carrinho),
      timestamp: Date.now()
    }));
  } catch (e) {}
}

function lerSnapshotCarrinho() {
  try {
    const raw = localStorage.getItem(CHAVE_ABANDONO);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function limparSnapshot() {
  try { localStorage.removeItem(CHAVE_ABANDONO); } catch (e) {}
}

function checarCarrinhoAbandonado() {
  if (location.pathname.endsWith('checkout.html')) return;

  const snapshot = lerSnapshotCarrinho();
  if (!snapshot) return;

  const carrinhoAtual = lerCarrinho();
  if (carrinhoAtual.length === 0) { limparSnapshot(); return; }

  const tempoPassado = Date.now() - snapshot.timestamp;
  if (tempoPassado < TEMPO_MINIMO_MS) return;

  if (sessionStorage.getItem('newtech_abandono_fechado') === '1') return;

  mostrarBannerAbandonado(snapshot);
}

function mostrarBannerAbandonado(snapshot) {
  document.getElementById('bannerAbandono')?.remove();

  const primeiroItem = snapshot.itens[0];
  const qtdTotal = snapshot.qtd;

  const banner = document.createElement('div');
  banner.id = 'bannerAbandono';
  banner.className = 'banner-abandono';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Carrinho abandonado');

  banner.innerHTML = `
    <div class="banner-abandono-inner">
      <div class="banner-abandono-mini" style="--c:${escapeHTML(primeiroItem.corHex || '#3a3a3c')}"></div>
      <div class="banner-abandono-texto">
        <strong>Você deixou ${qtdTotal} ${qtdTotal === 1 ? 'item' : 'itens'} na sacola</strong>
        <span>${escapeHTML(primeiroItem.nome)}${qtdTotal > 1 ? ` e mais ${qtdTotal - 1}` : ''} · Total ${fmt(snapshot.total)}</span>
      </div>
      <div class="banner-abandono-acoes">
        <a href="checkout.html" class="btn-abandono-finalizar">Finalizar</a>
        <button type="button" class="btn-abandono-fechar" aria-label="Fechar">✕</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
  setTimeout(() => banner.classList.add('aberto'), 200);

  banner.querySelector('.btn-abandono-fechar').addEventListener('click', () => {
    banner.classList.remove('aberto');
    sessionStorage.setItem('newtech_abandono_fechado', '1');
    setTimeout(() => banner.remove(), 400);
  });

  banner.querySelector('.btn-abandono-finalizar').addEventListener('click', () => {
    track('carrinho_abandonado_recuperado', {
      valor: snapshot.total,
      itens: qtdTotal
    });
  });
}

function observarMudancasCarrinho() {
  registrarSnapshotCarrinho();

  window.addEventListener('storage', (e) => {
    if (e.key === 'newtech_carrinho_v1') registrarSnapshotCarrinho();
  });

  setInterval(registrarSnapshotCarrinho, 5 * 60 * 1000);
}

observarMudancasCarrinho();
setTimeout(checarCarrinhoAbandonado, 1500);
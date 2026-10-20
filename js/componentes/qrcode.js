/* =========================================================
   QR CODE DO PRODUTO
   ========================================================= */

const QRSERVER_BASE = 'https://api.qrserver.com/v1/create-qr-code/';

function urlQRCode(texto, tamanho = 300) {
  const params = new URLSearchParams({
    size: `${tamanho}x${tamanho}`,
    data: texto,
    margin: 10,
    color: '0-113-227',
    bgcolor: '255-255-255'
  });
  return `${QRSERVER_BASE}?${params.toString()}`;
}

function abrirModalQRCode(produto) {
  const url = `${location.origin}/produto.html?id=${produto.id}`;
  const qrUrl = urlQRCode(url, 320);

  let modal = document.getElementById('modalQr');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalQr';
    modal.className = 'modal-qr';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'QR Code do produto');
    modal.innerHTML = `
      <div class="modal-qr-box">
        <button class="modal-qr-fechar" type="button" aria-label="Fechar">✕</button>
        <h3 class="modal-qr-titulo">Escaneie com o celular</h3>
        <p class="modal-qr-sub">Aponte a câmera para abrir este iPhone no seu telefone.</p>
        <div class="modal-qr-img-wrap">
          <img class="modal-qr-img" alt="QR Code do produto">
        </div>
        <p class="modal-qr-url" id="modalQrUrl"></p>
        <button class="modal-qr-copiar" type="button" id="modalQrCopiar">Copiar link</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharModalQRCode();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') fecharModalQRCode();
    });

    modal.querySelector('.modal-qr-fechar').addEventListener('click', fecharModalQRCode);
  }

  modal.querySelector('.modal-qr-img').src = qrUrl;
  modal.querySelector('#modalQrUrl').textContent = url;

  modal.querySelector('#modalQrCopiar').onclick = async (e) => {
    try {
      await navigator.clipboard.writeText(url);
      e.currentTarget.textContent = '✓ Copiado!';
      setTimeout(() => (e.currentTarget.textContent = 'Copiar link'), 2000);
      toast('Link copiado');
    } catch (err) {
      toast('Não foi possível copiar.');
    }
  };

  modal.classList.add('aberto');
  document.body.classList.add('travado');

  if (typeof track === 'function') {
    track('qrcode_aberto', { produto: produto.id });
  }
}

function fecharModalQRCode() {
  const modal = document.getElementById('modalQr');
  if (modal) modal.classList.remove('aberto');
  document.body.classList.remove('travado');
}
/* =========================================================
   PWA — registra Service Worker e oferece botão instalar
   ========================================================= */

function registrarSW() {
  if (!('serviceWorker' in navigator)) return;

  if (location.protocol === 'file:') {
    console.info('[PWA] Service Worker precisa de servidor HTTP. Rodando offline sem cache.');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => {
        setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
      })
      .catch((err) => {
        console.warn('[PWA] Falha ao registrar Service Worker:', err);
      });
  });
}

let promptInstalar = null;
const btnInstalar = () => document.getElementById('btnInstalar');

function criarBotaoInstalar() {
  if (btnInstalar()) return;

  const nav = document.querySelector('.nav-acoes');
  if (!nav) return;

  const btn = document.createElement('button');
  btn.id = 'btnInstalar';
  btn.className = 'instalar-btn';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Instalar aplicativo');
  btn.innerHTML = '📲 <span>Instalar</span>';
  btn.hidden = true;
  btn.addEventListener('click', () => {
    if (promptInstalar) {
      promptInstalar.prompt();
      promptInstalar.userChoice.then((escolha) => {
        if (escolha.outcome === 'accepted') {
          console.info('[PWA] App instalado!');
        }
        promptInstalar = null;
        btn.hidden = true;
      });
    }
  });

  nav.appendChild(btn);
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  promptInstalar = e;
  criarBotaoInstalar();
  const btn = btnInstalar();
  if (btn) btn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  const btn = btnInstalar();
  if (btn) btn.hidden = true;
  promptInstalar = null;
  console.info('[PWA] App instalado com sucesso!');
});

function esconderSeInstalado() {
  const emModoApp =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  if (emModoApp) {
    document.body.classList.add('modo-app');
    const btn = btnInstalar();
    if (btn) btn.hidden = true;
  }
}

registrarSW();
esconderSeInstalado();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) esconderSeInstalado();
});
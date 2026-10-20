/* =========================================================
   UI — tema + voltar ao topo + menu + toast global
   ========================================================= */

function iniciarTema() {
  const btn = document.getElementById('btnTema');
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');

  function atualizarMeta() {
    if (!meta) return;
    const cor = root.dataset.tema === 'claro' ? '#fbfbfd' : '#000000';
    meta.setAttribute('content', cor);
  }

  function alternar() {
    const atual = root.dataset.tema || 'escuro';
    const novo = atual === 'claro' ? 'escuro' : 'claro';
    root.dataset.tema = novo;
    try { localStorage.setItem('newtech_tema', novo); } catch (e) {}
    atualizarMeta();
  }

  if (btn) btn.addEventListener('click', alternar);
  atualizarMeta();

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', (e) => {
    try {
      if (localStorage.getItem('newtech_tema')) return;
    } catch (err) { return; }
    root.dataset.tema = e.matches ? 'escuro' : 'claro';
    atualizarMeta();
  });
}

function iniciarVoltarAoTopo() {
  const btn = document.getElementById('voltarTopo');
  if (!btn) return;

  let agendado = false;
  function verificar() {
    const mostrar = window.scrollY > 500;
    btn.classList.toggle('visivel', mostrar);
    agendado = false;
  }

  window.addEventListener('scroll', () => {
    if (!agendado) {
      requestAnimationFrame(verificar);
      agendado = true;
    }
  }, { passive: true });

  verificar();
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function iniciarMenuHamburguer() {
  const btn = document.getElementById('btnMenu');
  const drawer = document.getElementById('menuDrawer');
  const backdrop = document.getElementById('menuBackdrop');
  if (!btn || !drawer || !backdrop) return;

  function abrir() {
    btn.classList.add('aberto');
    drawer.classList.add('aberto');
    backdrop.classList.add('aberto');
    document.body.classList.add('menu-aberto');
  }
  function fechar() {
    btn.classList.remove('aberto');
    drawer.classList.remove('aberto');
    backdrop.classList.remove('aberto');
    document.body.classList.remove('menu-aberto');
  }
  function alternar() {
    if (drawer.classList.contains('aberto')) fechar();
    else abrir();
  }

  btn.addEventListener('click', alternar);
  backdrop.addEventListener('click', fechar);
  drawer.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', fechar);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fechar();
  });

  const media = window.matchMedia('(min-width: 721px)');
  media.addEventListener('change', (e) => {
    if (e.matches) fechar();
  });
}

let _toastTimer = null;

function toast(msg, opts = {}) {
  let el = document.getElementById('toast');

  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    document.body.appendChild(el);
  } else if (!el.hasAttribute('role')) {
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
  }

  el.textContent = msg;
  el.classList.add('aberto');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(
    () => el.classList.remove('aberto'),
    opts.duracao || 2400
  );
}

window.toast = toast;

iniciarTema();
iniciarVoltarAoTopo();
iniciarMenuHamburguer();
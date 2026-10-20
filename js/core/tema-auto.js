/* =========================================================
   TEMA AUTOMÁTICO POR HORÁRIO
   ========================================================= */

(function () {
  'use strict';

  const CHAVE_TEMA = 'newtech_tema';

  function temaPorHora() {
    const h = new Date().getHours();
    return (h >= 6 && h < 18) ? 'claro' : 'escuro';
  }

  function temEscolhaManual() {
    try { return !!localStorage.getItem(CHAVE_TEMA); } catch (e) { return false; }
  }

  function aplicarSeAutomatico() {
    if (temEscolhaManual()) return;

    const root = document.documentElement;
    const novo = temaPorHora();

    if (root.dataset.tema !== novo) {
      root.dataset.tema = novo;

      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', novo === 'claro' ? '#fbfbfd' : '#000000');
    }
  }

  aplicarSeAutomatico();

  setInterval(aplicarSeAutomatico, 30 * 60 * 1000);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) aplicarSeAutomatico();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('#btnTema')) {
      // ui.js vai gravar. Aqui só paramos de sobrescrever.
    }
  });
})();
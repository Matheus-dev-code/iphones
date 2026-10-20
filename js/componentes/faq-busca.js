/* =========================================================
   FAQ COM BUSCA — filtro em tempo real
   ========================================================= */

(function () {
  'use strict';

  const lista = document.getElementById('listaFAQ');
  if (!lista) return;

  if (document.getElementById('faqBusca')) return;

  const wrap = lista.parentElement;
  if (!wrap) return;

  const buscaWrap = document.createElement('div');
  buscaWrap.className = 'faq-busca-wrap';
  buscaWrap.innerHTML = `
    <input
      type="search"
      id="faqBusca"
      class="faq-busca"
      placeholder="Buscar pergunta..."
      autocomplete="off"
      aria-label="Buscar nas perguntas frequentes"
    >
    <span class="faq-busca-vazio" id="faqBuscaVazio" hidden>Nenhuma pergunta encontrada.</span>
  `;
  wrap.insertBefore(buscaWrap, lista);

  const input = document.getElementById('faqBusca');
  const vazio = document.getElementById('faqBuscaVazio');

  input.addEventListener('input', (e) => {
    const termo = e.target.value.trim().toLowerCase();
    const itens = lista.querySelectorAll('.faq-item');
    let visiveis = 0;

    itens.forEach((item) => {
      const pergunta = item.querySelector('.faq-pergunta')?.textContent.toLowerCase() || '';
      const resposta = item.querySelector('.faq-resposta')?.textContent.toLowerCase() || '';
      const match = !termo || pergunta.includes(termo) || resposta.includes(termo);

      item.style.display = match ? '' : 'none';
      if (match) visiveis++;

      if (termo && match) item.setAttribute('open', '');
      else if (termo && !match) item.removeAttribute('open');
    });

    vazio.hidden = visiveis > 0 || !termo;

    if (typeof track === 'function' && termo.length > 2) {
      clearTimeout(window.__faqBuscaTimer);
      window.__faqBuscaTimer = setTimeout(() => {
        track('faq_busca', { termo, resultados: visiveis });
      }, 800);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input
        && document.activeElement.tagName !== 'INPUT'
        && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      input.focus();
    }
  });
})();
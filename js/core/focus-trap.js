/* =========================================================
   FOCUS TRAP — prende o foco dentro de um modal
   ========================================================= */

function trapFocus(container) {
  if (!container) return { release: () => {} };

  const SELETOR_FOCAVEL = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const elementoAnterior = document.activeElement;

  function focaveis() {
    return Array.from(container.querySelectorAll(SELETOR_FOCAVEL))
      .filter((el) => el.offsetParent !== null);
  }

  function aoTeclar(e) {
    if (e.key !== 'Tab') return;
    const lista = focaveis();
    if (lista.length === 0) { e.preventDefault(); return; }

    const primeiro = lista[0];
    const ultimo = lista[lista.length - 1];

    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primeiro.focus();
    }
  }

  container.addEventListener('keydown', aoTeclar);

  const lista = focaveis();
  if (lista.length > 0) {
    setTimeout(() => lista[0].focus(), 50);
  }

  return {
    release() {
      container.removeEventListener('keydown', aoTeclar);
      if (elementoAnterior && typeof elementoAnterior.focus === 'function') {
        elementoAnterior.focus();
      }
    }
  };
}
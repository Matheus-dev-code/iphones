/* =========================================================
   BUSCA POR VOZ — Web Speech API
   ========================================================= */

function iniciarBuscaVoz() {
  const buscaInput = document.getElementById('busca');
  if (!buscaInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;

  const wrap = buscaInput.closest('.busca-wrap') || buscaInput.parentElement;
  if (!wrap) return;

  if (wrap.querySelector('.busca-voz')) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'busca-voz';
  btn.setAttribute('aria-label', 'Buscar por voz');
  btn.setAttribute('title', 'Buscar por voz');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/>
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V21a1 1 0 1 0 2 0v-3.08A7 7 0 0 0 19 11z"/>
    </svg>
  `;
  wrap.appendChild(btn);

  const rec = new SpeechRecognition();
  rec.lang = 'pt-BR';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  let gravando = false;

  function parar() {
    gravando = false;
    btn.classList.remove('gravando');
    try { rec.stop(); } catch (e) {}
  }

  btn.addEventListener('click', () => {
    if (gravando) { parar(); return; }

    try {
      rec.start();
      gravando = true;
      btn.classList.add('gravando');
      toast('🎤 Fale agora...');
      track('busca_voz_iniciada');
    } catch (err) {
      console.warn('[busca-voz] erro ao iniciar:', err);
      gravando = false;
      btn.classList.remove('gravando');
    }
  });

  rec.onresult = (e) => {
    const texto = e.results[0][0].transcript.trim();
    if (!texto) return;

    buscaInput.value = texto;
    buscaInput.dispatchEvent(new Event('input', { bubbles: true }));
    buscaInput.focus();

    toast(`Buscando: "${texto}"`);
    track('busca_voz_resultado', { termo: texto });
  };

  rec.onerror = (e) => {
    parar();
    if (e.error === 'not-allowed') {
      toast('Permissão de microfone negada.');
    } else if (e.error === 'no-speech') {
      toast('Não ouvi nada. Tente de novo.');
    } else {
      toast('Erro ao captar áudio.');
    }
  };

  rec.onend = () => parar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', iniciarBuscaVoz);
} else {
  iniciarBuscaVoz();
}
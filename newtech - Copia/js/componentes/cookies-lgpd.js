/* =========================================================
   COOKIES / LGPD — banner de consentimento
   ========================================================= */

const CHAVE_LGPD = 'newtech_lgpd_consent_v1';

function lerConsentimento() {
  try {
    const raw = localStorage.getItem(CHAVE_LGPD);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function gravarConsentimento(dados) {
  try {
    localStorage.setItem(CHAVE_LGPD, JSON.stringify({
      ...dados,
      data: new Date().toISOString()
    }));
  } catch (e) {}
}

function aceitouAnalytics() {
  const c = lerConsentimento();
  return !!(c && c.aceito && c.analytics);
}

function iniciarBannerCookies() {
  if (lerConsentimento()) return;

  if (location.hash === '#cookies') {
    try { localStorage.removeItem(CHAVE_LGPD); } catch (e) {}
  }

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Aviso de cookies');

  banner.innerHTML = `
    <div class="cookie-conteudo">
      <div class="cookie-texto">
        <strong>🍪 Nós usamos cookies</strong>
        <p>
          Usamos cookies pra melhorar sua experiência, entender como você
          navega e personalizar ofertas. Você pode aceitar tudo, recusar os
          opcionais ou configurar. Saiba mais na nossa
          <a href="privacidade.html">Política de Privacidade</a>.
        </p>
      </div>
      <div class="cookie-acoes">
        <button type="button" class="cookie-btn cookie-config" id="cookieConfig">Configurar</button>
        <button type="button" class="cookie-btn cookie-recusar" id="cookieRecusar">Só essenciais</button>
        <button type="button" class="cookie-btn cookie-aceitar" id="cookieAceitar">Aceitar tudo</button>
      </div>
    </div>

    <div class="cookie-config-painel" id="cookieConfigPainel" hidden>
      <h3>Preferências de cookies</h3>

      <label class="cookie-opcao">
        <input type="checkbox" checked disabled>
        <div>
          <strong>Essenciais</strong>
          <span>Necessários pro site funcionar (carrinho, tema, login). Não podem ser desativados.</span>
        </div>
      </label>

      <label class="cookie-opcao">
        <input type="checkbox" id="cookieOptAnalytics" checked>
        <div>
          <strong>Analytics</strong>
          <span>Ajuda a entender quais páginas são mais visitadas e onde há erros.</span>
        </div>
      </label>

      <label class="cookie-opcao">
        <input type="checkbox" id="cookieOptMarketing" checked>
        <div>
          <strong>Marketing</strong>
          <span>Usados pra mostrar ofertas relevantes em outros sites.</span>
        </div>
      </label>

      <div class="cookie-config-acoes">
        <button type="button" class="cookie-btn cookie-salvar" id="cookieSalvar">Salvar preferências</button>
      </div>
    </div>
  `;

  document.body.appendChild(banner);

  setTimeout(() => banner.classList.add('aberto'), 300);

  const painel = banner.querySelector('#cookieConfigPainel');

  banner.querySelector('#cookieConfig').addEventListener('click', () => {
    painel.hidden = !painel.hidden;
    banner.querySelector('#cookieConfig').textContent =
      painel.hidden ? 'Configurar' : 'Fechar';
  });

  banner.querySelector('#cookieAceitar').addEventListener('click', () => {
    gravarConsentimento({ aceito: true, analytics: true, marketing: true });
    fecharBanner(banner);
    aplicarConsentimento();
  });

  banner.querySelector('#cookieRecusar').addEventListener('click', () => {
    gravarConsentimento({ aceito: true, analytics: false, marketing: false });
    fecharBanner(banner);
    aplicarConsentimento();
  });

  banner.querySelector('#cookieSalvar').addEventListener('click', () => {
    const analytics = banner.querySelector('#cookieOptAnalytics').checked;
    const marketing = banner.querySelector('#cookieOptMarketing').checked;
    gravarConsentimento({ aceito: true, analytics, marketing });
    fecharBanner(banner);
    aplicarConsentimento();
  });
}

function fecharBanner(banner) {
  banner.classList.remove('aberto');
  setTimeout(() => banner.remove(), 400);
}

function aplicarConsentimento() {
  const c = lerConsentimento();
  if (!c) return;

  if (c.analytics) {
    if (typeof window.__ativarAnalytics === 'function') {
      window.__ativarAnalytics();
    }
    if (typeof track === 'function') {
      track('consent_granted', { analytics: c.analytics, marketing: c.marketing });
    }
  }
}

function revogarConsentimento() {
  try { localStorage.removeItem(CHAVE_LGPD); } catch (e) {}
  location.hash = '#cookies';
  location.reload();
}

window.revogarConsentimento = revogarConsentimento;
window.lerConsentimento = lerConsentimento;

iniciarBannerCookies();
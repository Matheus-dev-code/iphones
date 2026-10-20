/* =========================================================
   ERROR BOUNDARY GLOBAL
   ========================================================= */

const SENTRY_DSN = null;

function iniciarSentry() {
  if (!SENTRY_DSN) return;

  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/8.0.0/bundle.min.js';
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    if (typeof window.Sentry !== 'undefined') {
      window.Sentry.init({
        dsn: SENTRY_DSN,
        environment: location.hostname === 'localhost' ? 'development' : 'production',
        tracesSampleRate: 0.1,
        beforeSend(event) {
          if (typeof aceitouAnalytics === 'function' && !aceitouAnalytics()) {
            return null;
          }
          return event;
        }
      });
    }
  };
  document.head.appendChild(script);
}

let _erroToastTimer = null;
function mostrarToastErro(msg) {
  let el = document.getElementById('toastErro');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastErro';
    el.className = 'toast toast-erro';
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('aberto');

  clearTimeout(_erroToastTimer);
  _erroToastTimer = setTimeout(() => el.classList.remove('aberto'), 4500);
}

function tratarErro(erro, contexto = '') {
  const msg = erro && erro.message ? erro.message : String(erro);

  console.error(`[erro${contexto ? ' ' + contexto : ''}]`, erro);

  if (typeof track === 'function') {
    track('js_error', { message: msg, context: contexto });
  }

  if (typeof window.Sentry !== 'undefined' && window.Sentry.captureException) {
    window.Sentry.captureException(erro);
  }

  const chave = 'erro_mostrado_' + msg.slice(0, 60);
  try {
    if (!sessionStorage.getItem(chave)) {
      sessionStorage.setItem(chave, '1');
      mostrarToastErro('Algo deu errado. Tente novamente.');
    }
  } catch (e) {
    mostrarToastErro('Algo deu errado. Tente novamente.');
  }
}

window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    console.warn('[img] Falha ao carregar:', e.target.src);
    return;
  }
  if (e.target && e.target.tagName === 'SCRIPT') {
    console.warn('[script] Falha ao carregar:', e.target.src);
    return;
  }

  tratarErro(e.error || e.message, 'window.error');
});

window.addEventListener('unhandledrejection', (e) => {
  tratarErro(e.reason, 'unhandledrejection');
});

iniciarSentry();

window.tratarErro = tratarErro;
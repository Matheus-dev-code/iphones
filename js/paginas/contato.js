/* =========================================================
   CONTATO — validação e "envio" do formulário
   ========================================================= */

(function () {
  'use strict';

  const form = document.getElementById('formContato');
  if (!form) return;

  const $ = (sel) => form.querySelector(sel);

  const campos = {
    nome:     { input: $('#contatoNome'),     erro: $('#erroContatoNome') },
    email:    { input: $('#contatoEmail'),    erro: $('#erroContatoEmail') },
    assunto:  { input: $('#contatoAssunto'),  erro: $('#erroContatoAssunto') },
    mensagem: { input: $('#contatoMensagem'), erro: $('#erroContatoMensagem') }
  };

  function limparErro(campo) {
    campo.input.classList.remove('invalido');
    if (campo.erro) campo.erro.hidden = true;
  }

  function marcarErro(campo) {
    campo.input.classList.add('invalido');
    if (campo.erro) campo.erro.hidden = false;
  }

  Object.values(campos).forEach((campo) => {
    campo.input.addEventListener('input', () => limparErro(campo));
    campo.input.addEventListener('change', () => limparErro(campo));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let valido = true;

    if (campos.nome.input.value.trim().length < 2) {
      marcarErro(campos.nome); valido = false;
    }

    if (!validarEmail(campos.email.input.value)) {
      marcarErro(campos.email); valido = false;
    }

    if (!campos.assunto.input.value) {
      marcarErro(campos.assunto); valido = false;
    }

    if (campos.mensagem.input.value.trim().length < 10) {
      marcarErro(campos.mensagem); valido = false;
    }

    if (!valido) {
      const primeiro = form.querySelector('.invalido');
      if (primeiro) {
        primeiro.focus();
        primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast('Verifique os campos destacados.');
      return;
    }

    const msg = {
      nome: campos.nome.input.value.trim(),
      email: campos.email.input.value.trim(),
      assunto: campos.assunto.input.value,
      mensagem: campos.mensagem.input.value.trim(),
      data: new Date().toISOString()
    };

    try {
      const atuais = JSON.parse(localStorage.getItem('newtech_contatos_v1') || '[]');
      atuais.unshift(msg);
      localStorage.setItem('newtech_contatos_v1', JSON.stringify(atuais.slice(0, 50)));
    } catch (err) {}

    if (typeof track === 'function') {
      track('contato_enviado', { assunto: msg.assunto });
    }

    form.innerHTML = `
      <div class="contato-sucesso">
        <div class="icone">✓</div>
        <h3>Mensagem enviada!</h3>
        <p>Recebemos sua mensagem sobre "<strong>${escapeHTML(msg.assunto)}</strong>". Vamos responder em <strong>${escapeHTML(msg.email)}</strong> em até 1 dia útil.</p>
        <button type="button" onclick="location.reload()">Enviar outra mensagem</button>
      </div>
    `;
  });
})();
/* =========================================================
   EXPORTAR CSV — histórico de pedidos
   ========================================================= */

(function () {
  'use strict';

  const listaEl = document.getElementById('listaPedidos');
  if (!listaEl) return;

  if (document.getElementById('btnExportarCSV')) return;

  function injetarBotao() {
    const cabecalho = document.querySelector('.pedidos-cabecalho');
    if (!cabecalho) return;

    const btn = document.createElement('button');
    btn.id = 'btnExportarCSV';
    btn.type = 'button';
    btn.className = 'btn-exportar-csv';
    btn.innerHTML = '⬇️ Baixar histórico (CSV)';
    btn.hidden = true;

    cabecalho.appendChild(btn);

    btn.addEventListener('click', exportarPedidosCSV);
  }

  function mostrarBotaoSeTemPedidos() {
    const btn = document.getElementById('btnExportarCSV');
    if (!btn) return;
    const pedidos = lerPedidos();
    btn.hidden = pedidos.length === 0;
  }

  function escaparCSV(valor) {
    if (valor === null || valor === undefined) return '';
    const str = String(valor);
    if (/[",;\n\r]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportarPedidosCSV() {
    const pedidos = lerPedidos();
    if (!pedidos.length) {
      toast('Você ainda não tem pedidos.');
      return;
    }

    const cabecalho = [
      'Numero', 'Data', 'Qtd_Itens', 'Itens', 'Subtotal', 'Desconto_Cupom',
      'Cupom', 'Frete', 'Total', 'Pagamento', 'Email', 'Telefone', 'CEP',
      'Endereco', 'Numero_Endereco', 'Complemento', 'Bairro', 'Cidade', 'Estado'
    ];

    const linhas = pedidos.map((p) => {
      const itensStr = (p.itens || []).map((item) =>
        `${item.qtd}x ${item.nome} (${item.cor} / ${item.cap})`
      ).join(' | ');

      const qtdTotal = (p.itens || []).reduce((s, i) => s + (i.qtd || 0), 0);

      const c = p.cliente || {};

      return [
        p.numero, p.data, qtdTotal, itensStr,
        (p.subtotal || 0).toFixed(2),
        (p.descontoCupom || 0).toFixed(2),
        p.cupom ? p.cupom.codigo : '',
        p.frete ? (p.frete.valor || 0).toFixed(2) : '0.00',
        (p.total || 0).toFixed(2),
        p.pagamento || '', c.email || '', c.telefone || '', c.cep || '',
        c.endereco || '', c.numero || '', c.complemento || '',
        c.bairro || '', c.cidade || '', c.estado || ''
      ].map(escaparCSV).join(';');
    });

    const BOM = '\uFEFF';
    const csv = BOM + cabecalho.join(';') + '\n' + linhas.join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `newtech-pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast(`✓ ${pedidos.length} pedido${pedidos.length === 1 ? '' : 's'} exportado${pedidos.length === 1 ? '' : 's'}`);

    if (typeof track === 'function') {
      track('pedidos_exportados', { total: pedidos.length });
    }
  }

  injetarBotao();
  setTimeout(mostrarBotaoSeTemPedidos, 100);
  setInterval(mostrarBotaoSeTemPedidos, 2000);
})();
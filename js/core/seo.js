/* =========================================================
   SEO — title, description, JSON-LD
   ========================================================= */

function setMetaDescription(texto) {
  let el = document.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', texto);
}

function setOgTag(prop, valor) {
  let el = document.querySelector(`meta[property="${prop}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', valor);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

function injetarJsonLd(id, dados) {
  document.getElementById(id)?.remove();
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(dados);
  document.head.appendChild(script);
}

function injetarJsonLdProduto(produto, urlAtual) {
  injetarJsonLd('jsonld-produto', {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: produto.nome,
    description: produto.tagline,
    image: produto.cores[0]?.imagens?.[0]
      ? new URL(produto.cores[0].imagens[0], location.origin).href
      : undefined,
    sku: produto.id,
    brand: { '@type': 'Brand', name: 'Apple' },
    offers: {
      '@type': 'Offer',
      url: urlAtual,
      priceCurrency: 'BRL',
      price: produto.base.toFixed(2),
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: produto.rating.toFixed(1),
      reviewCount: produto.avaliacoes
    }
  });
}

function injetarJsonLdFaq() {
  if (typeof FAQ === 'undefined' || !Array.isArray(FAQ)) return;

  injetarJsonLd('jsonld-faq', {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.resposta
      }
    }))
  });
}

function injetarJsonLdBreadcrumb(itens) {
  if (!Array.isArray(itens) || itens.length === 0) return;

  injetarJsonLd('jsonld-breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: itens.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.nome,
      item: item.url
    }))
  });
}

function injetarJsonLdOrganization() {
  injetarJsonLd('jsonld-org', {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NewTech',
    url: location.origin,
    logo: `${location.origin}/img/icon-512.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-99999-9999',
      contactType: 'Atendimento ao cliente',
      areaServed: 'BR',
      availableLanguage: ['Portuguese']
    }
  });
}

function aplicarSeoProduto(produto) {
  const urlAtual = location.href;

  document.title = `${produto.nome} — R$ ${produto.base.toLocaleString('pt-BR')} | NewTech`;

  setMetaDescription(
    `${produto.nome}: ${produto.tagline} Em até 12x sem juros, frete grátis, 12 meses de garantia e pagamento na entrega.`
  );

  setOgTag('og:title', `${produto.nome} — NewTech`);
  setOgTag('og:description', produto.tagline);
  setOgTag('og:url', urlAtual);
  setOgTag('og:type', 'product');

  if (produto.cores[0]?.imagens?.[0]) {
    const imgUrl = new URL(produto.cores[0].imagens[0], location.origin).href;
    setOgTag('og:image', imgUrl);
  }

  setCanonical(urlAtual);
  injetarJsonLdProduto(produto, urlAtual);

  injetarJsonLdBreadcrumb([
    { nome: 'Início', url: location.origin + '/index.html' },
    { nome: 'iPhones', url: location.origin + '/index.html#produtos' },
    { nome: produto.nome, url: urlAtual }
  ]);
}

function aplicarSeoHome() {
  const urlAtual = location.origin + '/';
  setCanonical(urlAtual);
  injetarJsonLdOrganization();
  injetarJsonLdFaq();
}
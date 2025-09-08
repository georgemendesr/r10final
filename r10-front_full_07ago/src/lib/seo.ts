export function buildSiteMeta() {
  const title = 'R10 Piauí — Notícias do Piauí e do Brasil';
  const description = 'Portal R10 Piauí: últimas notícias, política, polícia, esportes e entretenimento.';
  const url = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5175';
  const image = `${url}/img/og-default.jpg`;
  return { title, description, url, image };
}

export function buildArticleMeta(post: { title: string; subtitle?: string; imagemDestaque?: string; slug?: string; id?: string; }) {
  const site = buildSiteMeta();
  const title = post.title ? `${post.title} — R10 Piauí` : site.title;
  const description = post.subtitle || site.description;
  const url = typeof window !== 'undefined' ? window.location.href : `${site.url}/`;
  const image = post.imagemDestaque || `${site.url}/img/og-default.jpg`;
  return { title, description, url, image };
}

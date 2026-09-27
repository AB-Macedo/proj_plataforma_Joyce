import { env } from 'cloudflare:workers';
import Link from 'next/link';
import { formatMoney } from '../../lib/public-services';

/* eslint-disable @next/next/no-img-element */

export const dynamic = 'force-dynamic';

type Product = { id: number; name: string; category: string; description: string; price_cents: number; image_url: string | null };

export default async function ProductsPage() {
  const result = await env.DB.prepare('SELECT id, name, category, description, price_cents, image_url FROM products WHERE active=true AND archived=false ORDER BY sort_order, name COLLATE NOCASE').all<Product>();
  return <main className="shop-page">
    <header className="site-header shop-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">M</span><span>Magia Theia</span></Link><nav aria-label="Navegação"><Link href="/#consultas">Consultas</Link><Link href="/produtos">Loja</Link></nav><a className="header-cta" href="https://wa.me/5527988043118?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20os%20produtos%20sob%20encomenda." target="_blank" rel="noreferrer">Falar no WhatsApp</a></header>
    <section className="shop-hero"><p className="kicker"><span /> Feito com intenção</p><h1>Produtos artesanais<br/><em>sob encomenda.</em></h1><p>Velas, incensos e perfumes preparados à mão para acompanhar intenções, rituais e momentos especiais.</p></section>
    <section className="shop-catalog"><div className="shop-intro"><div><p className="kicker"><span /> Loja Magia Theia</p><h2>Cada criação começa com uma conversa.</h2></div><p>Todos os produtos são feitos sob encomenda. Conte o que você busca e a Joyce orienta a composição, o prazo e o valor final.</p></div>
      <div className="product-grid">{result.results.map((product) => <article className="product-card" key={product.id}><div className={`product-visual product-${product.category.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]+/g, '-')}`}>{product.image_url ? <img src={product.image_url} alt={product.name} /> : <><span>✦</span><small>MAGIA THEIA</small></>}</div><div className="product-copy"><span className="product-category">{product.category}</span><h3>{product.name}</h3><p>{product.description}</p><div><strong>{product.price_cents > 0 ? formatMoney(product.price_cents) : 'Valor sob consulta'}</strong><em>Sob encomenda</em></div><a href={`https://wa.me/5527988043118?text=${encodeURIComponent(`Olá! Gostaria de encomendar ${product.name}.`)}`} target="_blank" rel="noreferrer">Pedir pelo WhatsApp →</a></div></article>)}</div>
      {!result.results.length && <div className="shop-empty"><span>✦</span><h2>Novas criações estão sendo preparadas.</h2><p>Fale pelo WhatsApp para fazer uma encomenda personalizada.</p></div>}
    </section>
    <section className="shop-custom"><p className="kicker"><span /> Personalizado para você</p><h2>Não encontrou exatamente o que procura?</h2><p>As combinações de cores, óleos, ervas e essências podem ser definidas em conversa com a Joyce — e, nos perfumes rituais, também a partir de uma leitura.</p><a className="button button-primary" href="https://wa.me/5527988043118?text=Olá!%20Gostaria%20de%20conversar%20sobre%20uma%20encomenda%20personalizada." target="_blank" rel="noreferrer">Conversar sobre uma encomenda</a></section>
    <footer><Link className="brand footer-brand" href="/"><span className="brand-mark">M</span><span>Magia Theia</span></Link><p>Criações artesanais feitas com cuidado e intenção.</p><Link href="/#consultas">Voltar para as consultas →</Link></footer>
  </main>;
}

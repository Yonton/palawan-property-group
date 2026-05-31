import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

// Generates /sitemap-index.xml at build time (matches robots.txt).
// Self-contained — no @astrojs/sitemap dependency required.
export const GET: APIRoute = async () => {
  const listings = await getCollection('listings');
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/listings', priority: '0.9', changefreq: 'weekly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  ];

  const urls = [
    ...staticPages.map((p) => ({
      loc: new URL(p.path, site.url).href,
      priority: p.priority,
      changefreq: p.changefreq,
    })),
    ...listings.map((l) => ({
      loc: new URL(`/listings/${l.data.slug}`, site.url).href,
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};

export default function handler(req, res) {
  const baseUrl = 'https://heat.nz';
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  // Static pages with their priorities and change frequencies
  const staticPages = [
    {
      url: '',
      priority: '1.0',
      changefreq: 'daily',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating',
      priority: '0.9',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/contact',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/about',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/quote-status',
      priority: '0.6',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/tradesman-login',
      priority: '0.5',
      changefreq: 'monthly',
      lastmod: currentDate
    }
  ];

  // Blog posts (can be dynamically generated from CMS or file system)
  const blogPosts = [
    {
      url: '/blog/why-underfloor-heating-ideal-auckland-homes',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    }
  ];

  // Key suburb service pages (high-priority Auckland suburbs)
  const suburbPages = [
    {
      url: '/services/underfloor-heating/remuera',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/ponsonby',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/parnell',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/herne-bay',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/st-heliers',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/takapuna',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/devonport',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/mission-bay',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/grey-lynn',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/epsom',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    }
  ];

  // Combine all pages
  const allPages = [...staticPages, ...blogPosts, ...suburbPages];

  // Generate XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Set the content type to XML
  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  
  // Send the sitemap
  res.status(200).send(sitemap);
}

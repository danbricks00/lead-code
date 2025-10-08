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
    },
    {
      url: '/faq',
      priority: '0.7',
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
    },
    {
      url: '/blog/electric-vs-hydronic-underfloor-heating',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/blog/underfloor-heating-maintenance-tips',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/blog/energy-efficient-heating-solutions',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/blog/renovation-heating-options',
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: currentDate
    }
  ];

  // Additional service pages
  const servicePages = [
    {
      url: '/services/electric-underfloor-heating',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/hydronic-underfloor-heating',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/heating-maintenance',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/heating-repairs',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-remuera',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-ponsonby',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-central-auckland',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-west-auckland',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-east-auckland',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating-south-auckland',
      priority: '0.8',
      changefreq: 'weekly',
      lastmod: currentDate
    }
  ];

  // Key suburb service pages (high-priority Auckland suburbs)
  const suburbPages = [
    // Central Auckland
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
      url: '/services/underfloor-heating/newmarket',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/epsom',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/mt-eden',
      priority: '0.8',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    // North Shore
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
      url: '/services/underfloor-heating/northcote',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/birkenhead',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/albany',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    // East Auckland
    {
      url: '/services/underfloor-heating/kohimarama',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/mission-bay',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/glendowie',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/beachlands',
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    // West Auckland
    {
      url: '/services/underfloor-heating/henderson',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/massey',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/new-lynn',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/titirangi',
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    // South Auckland
    {
      url: '/services/underfloor-heating/manurewa',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/papakura',
      priority: '0.7',
      changefreq: 'monthly',
      lastmod: currentDate
    },
    {
      url: '/services/underfloor-heating/pukekohe',
      priority: '0.6',
      changefreq: 'monthly',
      lastmod: currentDate
    }
  ];

  // Combine all pages
  const allPages = [...staticPages, ...blogPosts, ...servicePages, ...suburbPages];

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

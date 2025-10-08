import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SEO({
  title = "Heat NZ | Underfloor Heating Auckland — Free Quote",
  description = "Underfloor heating specialists in Auckland. Supply, install & service electric and hydronic systems. Fast quotes & warranties.",
  canonical = null,
  ogImage = "/social-share.png",
  type = "website",
  keywords = "underfloor heating Auckland, electric underfloor heating, hydronic heating, heating installation Auckland",
  noindex = false,
  structuredData = null,
  faqData = null
}) {
  const router = useRouter();
  const fullTitle = title.includes("Heat NZ") ? title : `Heat NZ | ${title}`;
  
  // Construct canonical URL if not provided
  const canonicalUrl = canonical || (typeof window !== 'undefined' 
    ? `${window.location.origin}${router.asPath}` 
    : `https://heat.nz${router.asPath || ''}`);
  
  // Construct og:url
  const ogUrl = canonical || (typeof window !== 'undefined' 
    ? `${window.location.origin}${router.asPath}` 
    : `https://heat.nz${router.asPath || ''}`);
  
  // Default LocalBusiness structured data
  const defaultLocalBusinessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Heat NZ",
    "url": "https://heat.nz",
    "telephone": "+64-9-123-4567",
    "image": "https://heat.nz/logo.png",
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "addressCountry": "NZ"
    },
    "areaServed": [
      { "name": "Auckland" },
      { "name": "Remuera" },
      { "name": "Ponsonby" },
      { "name": "Parnell" },
      { "name": "Herne Bay" },
      { "name": "St Heliers" },
      { "name": "Takapuna" },
      { "name": "Devonport" },
      { "name": "Mission Bay" },
      { "name": "Grey Lynn" },
      { "name": "Epsom" },
      { "name": "Newmarket" },
      { "name": "Parnell" },
      { "name": "Freemans Bay" },
      { "name": "Kohimarama" },
      { "name": "Glendowie" },
      { "name": "Milford" },
      { "name": "Castor Bay" },
      { "name": "Belmont" },
      { "name": "Albany" },
      { "name": "Browns Bay" },
      { "name": "Northcote" },
      { "name": "Birkenhead" },
      { "name": "Mairangi Bay" },
      { "name": "Murrays Bay" },
      { "name": "Torbay" },
      { "name": "Long Bay" },
      { "name": "Greenhithe" },
      { "name": "Pinehill" },
      { "name": "Rosedale" },
      { "name": "Glenfield" },
      { "name": "Beach Haven" },
      { "name": "Birkdale" },
      { "name": "Highbury" },
      { "name": "Hillcrest" },
      { "name": "Wairau Valley" },
      { "name": "Forrest Hill" },
      { "name": "Sunset Beach" },
      { "name": "Campbells Bay" },
      { "name": "Rothesay Bay" },
      { "name": "Torbay" },
      { "name": "Stanmore Bay" },
      { "name": "Red Beach" },
      { "name": "Orewa" },
      { "name": "Waiwera" },
      { "name": "Puhoi" },
      { "name": "Warkworth" },
      { "name": "Matakana" },
      { "name": "Snells Beach" },
      { "name": "Algies Bay" },
      { "name": "Omaha" },
      { "name": "Leigh" },
      { "name": "Pakiri" },
      { "name": "Mangawhai" },
      { "name": "Kaukapakapa" },
      { "name": "Helensville" },
      { "name": "Parakai" },
      { "name": "Riverhead" },
      { "name": "Kumeu" },
      { "name": "Huapai" },
      { "name": "Waimauku" },
      { "name": "Muriwai" },
      { "name": "Bethells Beach" },
      { "name": "Piha" },
      { "name": "Karekare" },
      { "name": "Anawhata" },
      { "name": "Te Henga" },
      { "name": "Swanson" },
      { "name": "Henderson" },
      { "name": "Massey" },
      { "name": "Westgate" },
      { "name": "Hobsonville" },
      { "name": "Whenuapai" },
      { "name": "Herald Island" },
      { "name": "Beachlands" },
      { "name": "Maraetai" },
      { "name": "Whitford" },
      { "name": "Clevedon" },
      { "name": "Ardmore" },
      { "name": "Papakura" },
      { "name": "Takanini" },
      { "name": "Manurewa" },
      { "name": "Wiri" },
      { "name": "Mangere" },
      { "name": "Otahuhu" },
      { "name": "Onehunga" },
      { "name": "Royal Oak" },
      { "name": "Three Kings" },
      { "name": "Mt Roskill" },
      { "name": "Sandringham" },
      { "name": "Kingsland" },
      { "name": "Morningside" },
      { "name": "Balmoral" },
      { "name": "Dominion Road" },
      { "name": "Mt Albert" },
      { "name": "Pt Chevalier" },
      { "name": "Westmere" },
      { "name": "Meola" },
      { "name": "Arch Hill" },
      { "name": "Newton" },
      { "name": "Grafton" },
      { "name": "Ponsonby" },
      { "name": "Freemans Bay" },
      { "name": "St Marys Bay" },
      { "name": "Herne Bay" },
      { "name": "Westmere" },
      { "name": "Grey Lynn" },
      { "name": "Kingsland" },
      { "name": "Eden Terrace" },
      { "name": "Mt Eden" },
      { "name": "Epsom" },
      { "name": "Greenlane" },
      { "name": "Remuera" },
      { "name": "Newmarket" },
      { "name": "Parnell" },
      { "name": "Grafton" },
      { "name": "Auckland CBD" },
      { "name": "Viaduct Harbour" },
      { "name": "Wynyard Quarter" },
      { "name": "Northcote Point" },
      { "name": "Birkenhead" },
      { "name": "Challis" },
      { "name": "Birkdale" },
      { "name": "Beach Haven" },
      { "name": "Bayview" },
      { "name": "Glenfield" },
      { "name": "Hillcrest" },
      { "name": "Wairau Valley" },
      { "name": "Forrest Hill" },
      { "name": "Sunset Beach" },
      { "name": "Campbells Bay" },
      { "name": "Rothesay Bay" },
      { "name": "Torbay" },
      { "name": "Long Bay" },
      { "name": "Browns Bay" },
      { "name": "Mairangi Bay" },
      { "name": "Murrays Bay" },
      { "name": "Rothesay Bay" },
      { "name": "Torbay" },
      { "name": "Long Bay" },
      { "name": "Orewa" },
      { "name": "Waiwera" },
      { "name": "Puhoi" },
      { "name": "Warkworth" },
      { "name": "Matakana" },
      { "name": "Snells Beach" },
      { "name": "Algies Bay" },
      { "name": "Omaha" },
      { "name": "Leigh" },
      { "name": "Pakiri" },
      { "name": "Mangawhai" },
      { "name": "Kaukapakapa" },
      { "name": "Helensville" },
      { "name": "Parakai" },
      { "name": "Riverhead" },
      { "name": "Kumeu" },
      { "name": "Huapai" },
      { "name": "Waimauku" },
      { "name": "Muriwai" },
      { "name": "Bethells Beach" },
      { "name": "Piha" },
      { "name": "Karekare" },
      { "name": "Anawhata" },
      { "name": "Te Henga" },
      { "name": "Swanson" },
      { "name": "Henderson" },
      { "name": "Massey" },
      { "name": "Westgate" },
      { "name": "Hobsonville" },
      { "name": "Whenuapai" },
      { "name": "Herald Island" },
      { "name": "Beachlands" },
      { "name": "Maraetai" },
      { "name": "Whitford" },
      { "name": "Clevedon" },
      { "name": "Ardmore" },
      { "name": "Papakura" },
      { "name": "Takanini" },
      { "name": "Manurewa" },
      { "name": "Wiri" },
      { "name": "Mangere" },
      { "name": "Otahuhu" },
      { "name": "Onehunga" },
      { "name": "Royal Oak" },
      { "name": "Three Kings" },
      { "name": "Mt Roskill" },
      { "name": "Sandringham" },
      { "name": "Kingsland" },
      { "name": "Morningside" },
      { "name": "Balmoral" },
      { "name": "Dominion Road" },
      { "name": "Mt Albert" },
      { "name": "Pt Chevalier" },
      { "name": "Westmere" },
      { "name": "Meola" },
      { "name": "Arch Hill" },
      { "name": "Newton" },
      { "name": "Grafton" },
      { "name": "Ponsonby" },
      { "name": "Freemans Bay" },
      { "name": "St Marys Bay" },
      { "name": "Herne Bay" },
      { "name": "Westmere" },
      { "name": "Grey Lynn" },
      { "name": "Kingsland" },
      { "name": "Eden Terrace" },
      { "name": "Mt Eden" },
      { "name": "Epsom" },
      { "name": "Greenlane" },
      { "name": "Remuera" },
      { "name": "Newmarket" },
      { "name": "Parnell" },
      { "name": "Grafton" },
      { "name": "Auckland CBD" },
      { "name": "Viaduct Harbour" },
      { "name": "Wynyard Quarter" }
    ],
    "sameAs": [
      "https://www.facebook.com/heatnz"
    ],
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "08:00",
        "closes": "17:00"
      }
    ]
  };

  // Default Service structured data for underfloor heating
  const defaultServiceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation",
    "provider": {
      "name": "Heat NZ",
      "url": "https://heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Underfloor heating installation, maintenance & repair",
    "description": "Supply and professional installation of electric and hydronic underfloor heating systems across Auckland. Free site quotes and warranties available."
  };

  // Default FAQ structured data
  const defaultFAQData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does underfloor heating cost in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Underfloor heating costs in Auckland typically range from $80-$150 per square meter for electric systems and $120-$200 per square meter for hydronic systems, including installation. We provide free quotes for all projects."
        }
      },
      {
        "@type": "Question", 
        "name": "How long does underfloor heating installation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Installation time varies by system type and room size. Electric underfloor heating typically takes 1-3 days, while hydronic systems may take 3-7 days. We provide detailed timelines with every quote."
        }
      },
      {
        "@type": "Question",
        "name": "Do you service underfloor heating systems in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we provide comprehensive maintenance and repair services for both electric and hydronic underfloor heating systems throughout Auckland and surrounding areas."
        }
      },
      {
        "@type": "Question",
        "name": "What types of underfloor heating do you install?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We install both electric and hydronic underfloor heating systems. Electric systems are ideal for smaller areas and renovations, while hydronic systems are more efficient for larger spaces and new builds."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide warranties on your installations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all our installations come with comprehensive warranties covering both materials and workmanship. Warranty periods vary by system type and manufacturer."
        }
      }
    ]
  };

  // Review schema for testimonials
  const defaultReviewData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Heat NZ",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "47",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": [
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Sarah M."
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Our new underfloor heating has completely changed how we live. It's warm, efficient, and no more cold tiles in winter!"
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "James R."
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "The whole process was simple! Heat.nz found us a reliable installer who finished on time and within budget."
      },
      {
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": "Anika P."
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": "5",
          "bestRating": "5"
        },
        "reviewBody": "Worth every dollar. The system runs quietly, the house feels amazing, and our power bills actually went down."
      }
    ]
  };

  // Breadcrumb schema
  const defaultBreadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://heat.nz"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Underfloor Heating Auckland",
        "item": "https://heat.nz/services/underfloor-heating"
      }
    ]
  };

  // Combine structured data
  const allStructuredData = [];
  
  if (structuredData) {
    allStructuredData.push(...(Array.isArray(structuredData) ? structuredData : [structuredData]));
  } else {
    allStructuredData.push(defaultLocalBusinessData, defaultServiceData);
  }
  
  if (faqData) {
    allStructuredData.push(Array.isArray(faqData) ? faqData : faqData);
  } else {
    allStructuredData.push(defaultFAQData);
  }

  // Add review and breadcrumb schemas
  allStructuredData.push(defaultReviewData, defaultBreadcrumbData);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Favicon and Icons */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <meta name="theme-color" content="#667eea" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Heat NZ" />
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="800" />
      <meta property="og:image:height" content="418" />
      <meta property="og:site_name" content="Heat NZ" />
      <meta property="og:locale" content="en_NZ" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Tags */}
      <meta name="author" content="Heat NZ" />
      <meta name="geo.region" content="NZ-AUK" />
      <meta name="geo.placename" content="Auckland" />
      <meta name="geo.position" content="-36.8485;174.7633" />
      <meta name="ICBM" content="-36.8485, 174.7633" />
      
      {/* Structured Data */}
      {allStructuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data, null, 2)
          }}
        />
      ))}
      
      {/* Google Analytics 4 */}
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_title: '${fullTitle}',
                  page_location: '${canonical}'
                });
              `
            }}
          />
        </>
      )}
    </Head>
  );
}

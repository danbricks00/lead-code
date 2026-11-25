import Head from 'next/head';
import { useRouter } from 'next/router';

export default function SEO({
  title = "Heat NZ | Underfloor Heating Auckland — Free Quote",
  description = "Underfloor heating specialists in Auckland. Premium electric underfloor heating installation. Fast quotes & 10-year warranties.",
  canonical = null,
  ogImage = "/social-share.png",
  type = "website",
  keywords = "underfloor heating Auckland, electric underfloor heating, heating installation Auckland",
  noindex = false,
  structuredData = null,
  faqData = null
}) {
  const router = useRouter();
  const fullTitle = title.includes("Heat NZ") ? title : `Heat NZ | ${title}`;
  
  // Construct canonical URL if not provided (always use www subdomain)
  const canonicalUrl = canonical || (typeof window !== 'undefined' 
    ? `${window.location.origin}${router.asPath}`.replace('https://heat.nz', 'https://www.heat.nz')
    : `https://www.heat.nz${router.asPath || ''}`);
  
  // Construct og:url (always use www subdomain)
  const ogUrl = canonical || (typeof window !== 'undefined' 
    ? `${window.location.origin}${router.asPath}`.replace('https://heat.nz', 'https://www.heat.nz')
    : `https://www.heat.nz${router.asPath || ''}`);
  
  // Default LocalBusiness structured data (merged with reviews)
  const defaultLocalBusinessData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Heat NZ",
    "description": "Professional electric underfloor heating installation in Auckland",
    "url": "https://www.heat.nz",
    "telephone": "+64-9-123-4567",
    "email": "info@heat.nz",
    "image": "https://www.heat.nz/logo.png",
    "priceRange": "Custom quote",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer",
    "currenciesAccepted": "NZD",
    "openingHours": "Mo-Fr 08:00-17:00, Sa 09:00-15:00",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Queen Street",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "postalCode": "1010",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-36.8485",
      "longitude": "174.7633"
    },
    "areaServed": [
      { "name": "Auckland" },
      { "name": "Auckland CBD" },
      { "name": "Albany" },
      { "name": "Algies Bay" },
      { "name": "Anawhata" },
      { "name": "Arch Hill" },
      { "name": "Ardmore" },
      { "name": "Balcolyn" },
      { "name": "Balmoral" },
      { "name": "Bayview" },
      { "name": "Beach Haven" },
      { "name": "Beachlands" },
      { "name": "Belmont" },
      { "name": "Bethells Beach" },
      { "name": "Birkenhead" },
      { "name": "Birkdale" },
      { "name": "Browns Bay" },
      { "name": "Campbells Bay" },
      { "name": "Castor Bay" },
      { "name": "Challis" },
      { "name": "Clevedon" },
      { "name": "Devonport" },
      { "name": "Dominion Road" },
      { "name": "Eden Terrace" },
      { "name": "Epsom" },
      { "name": "Forrest Hill" },
      { "name": "Freemans Bay" },
      { "name": "Glendowie" },
      { "name": "Glenfield" },
      { "name": "Grafton" },
      { "name": "Greenhithe" },
      { "name": "Greenlane" },
      { "name": "Grey Lynn" },
      { "name": "Helensville" },
      { "name": "Henderson" },
      { "name": "Herne Bay" },
      { "name": "Herald Island" },
      { "name": "Highbury" },
      { "name": "Hillcrest" },
      { "name": "Hobsonville" },
      { "name": "Huapai" },
      { "name": "Karekare" },
      { "name": "Kaukapakapa" },
      { "name": "Kingsland" },
      { "name": "Kohimarama" },
      { "name": "Kumeu" },
      { "name": "Leigh" },
      { "name": "Long Bay" },
      { "name": "Mairangi Bay" },
      { "name": "Mangawhai" },
      { "name": "Mangere" },
      { "name": "Manurewa" },
      { "name": "Maraetai" },
      { "name": "Massey" },
      { "name": "Matakana" },
      { "name": "Meola" },
      { "name": "Milford" },
      { "name": "Mission Bay" },
      { "name": "Morningside" },
      { "name": "Mt Albert" },
      { "name": "Mt Eden" },
      { "name": "Mt Roskill" },
      { "name": "Murrays Bay" },
      { "name": "Muriwai" },
      { "name": "Newmarket" },
      { "name": "Newton" },
      { "name": "Northcote" },
      { "name": "Northcote Point" },
      { "name": "Omaha" },
      { "name": "Onehunga" },
      { "name": "Orewa" },
      { "name": "Otahuhu" },
      { "name": "Pakiri" },
      { "name": "Papakura" },
      { "name": "Parakai" },
      { "name": "Parnell" },
      { "name": "Piha" },
      { "name": "Pinehill" },
      { "name": "Ponsonby" },
      { "name": "Pt Chevalier" },
      { "name": "Puhoi" },
      { "name": "Red Beach" },
      { "name": "Remuera" },
      { "name": "Riverhead" },
      { "name": "Rothesay Bay" },
      { "name": "Rosedale" },
      { "name": "Royal Oak" },
      { "name": "Sandringham" },
      { "name": "Snells Beach" },
      { "name": "St Heliers" },
      { "name": "St Marys Bay" },
      { "name": "Stanmore Bay" },
      { "name": "Sunset Beach" },
      { "name": "Swanson" },
      { "name": "Takapuna" },
      { "name": "Takanini" },
      { "name": "Te Henga" },
      { "name": "Three Kings" },
      { "name": "Torbay" },
      { "name": "Viaduct Harbour" },
      { "name": "Waiwera" },
      { "name": "Waimauku" },
      { "name": "Wairau Valley" },
      { "name": "Warkworth" },
      { "name": "Westgate" },
      { "name": "Westmere" },
      { "name": "Whenuapai" },
      { "name": "Whitford" },
      { "name": "Wiri" },
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
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Saturday"],
        "opens": "09:00",
        "closes": "15:00"
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127",
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

  // Default Service structured data for underfloor heating
  const defaultServiceData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Underfloor Heating Installation",
    "provider": {
      "name": "Heat NZ",
      "url": "https://www.heat.nz"
    },
    "areaServed": {
      "name": "Auckland"
    },
    "serviceType": "Electric underfloor heating installation",
    "description": "Supply and professional installation of premium electric underfloor heating systems across Auckland. Free custom site quotes and 10-year warranties available."
  };

  // Default FAQ structured data
  const defaultFAQData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much does electric underfloor heating cost in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Every home is different. Costs depend on your floor plan, room sizes, and system requirements. We provide free, no-obligation custom quotes tailored to your specific project."
        }
      },
      {
        "@type": "Question", 
        "name": "How long does electric underfloor heating installation take?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Installation timeframes vary depending on the scope of your project and floor type. We provide a detailed timeline with every custom quote."
        }
      },
      {
        "@type": "Question",
        "name": "What types of underfloor heating do you install?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We specialise exclusively in premium electric underfloor heating systems for bathrooms, kitchens, living areas, and whole-home installations."
        }
      },
      {
        "@type": "Question",
        "name": "Do you provide warranties on your installations?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all our electric underfloor heating installations come with a 10-year warranty covering both materials and workmanship."
        }
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
        "item": "https://www.heat.nz"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Electric Underfloor Heating",
        "item": "https://www.heat.nz/services/electric-underfloor-heating"
      }
    ]
  };

  // Pricing schema for service costs
  const defaultPricingData = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Electric Underfloor Heating Installation",
    "description": "Professional electric underfloor heating installation in Auckland",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Heat NZ"
    },
    "offers": [
      {
        "@type": "Offer",
        "name": "Electric Underfloor Heating",
        "description": "Premium electric underfloor heating installation — custom quote based on your floor plan",
        "availability": "https://schema.org/InStock"
      }
    ],
    "areaServed": {
      "@type": "City",
      "name": "Auckland",
      "addressCountry": "NZ"
    }
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

  // Add breadcrumb and pricing schemas (review data is already in LocalBusiness)
  allStructuredData.push(defaultBreadcrumbData, defaultPricingData);

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

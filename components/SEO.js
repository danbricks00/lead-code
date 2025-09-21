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
    : `https://heat.nz${router.asPath}`);
  
  // Construct og:url
  const ogUrl = canonical || (typeof window !== 'undefined' 
    ? `${window.location.origin}${router.asPath}` 
    : `https://heat.nz${router.asPath}`);
  
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

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
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

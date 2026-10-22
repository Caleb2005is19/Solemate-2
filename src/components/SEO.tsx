import React from 'react';
import { Helmet } from 'react-helmet-async';
import { PromoCampaign } from '../services/types';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schemaData?: object | object[];
  promotions?: PromoCampaign[];
}

export function SEO({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  ogType = 'website',
  schemaData,
  promotions = []
}: SEOProps) {
  const siteName = 'Solemate.co.ke';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Shop the latest premium sneakers, boots, and casual shoes at Solemate.co.ke. Fast delivery across Kenya, secure M-Pesa payments, and authentic footwear brands.';
  const metaDescription = description || defaultDescription;
  const url = typeof window !== 'undefined' ? window.location.href : 'https://solemate.co.ke';

  // Build promotional SaleEvent schema for rich search snippets
  const activePromoSchemas = (promotions || [])
    .filter(p => p.active)
    .map(p => ({
      "@context": "https://schema.org",
      "@type": "SaleEvent",
      "name": p.title,
      "description": p.subtitle || `${p.badgeText || 'Special Offer'}: Use coupon code ${p.couponCode || 'PROMO'}`,
      "startDate": p.startDate || new Date().toISOString(),
      "endDate": p.endDate || new Date(Date.now() + 14 * 86400000).toISOString(),
      "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
      "eventStatus": "https://schema.org/EventScheduled",
      "location": {
        "@type": "VirtualLocation",
        "url": p.link ? `https://solemate.co.ke${p.link}` : "https://solemate.co.ke/shop"
      },
      "organizer": {
        "@type": "Organization",
        "name": "Solemate Kenya",
        "url": "https://solemate.co.ke"
      }
    }));

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* Structured Data (JSON-LD) */}
      {schemaData && (
        <script type="application/ld+json">
          {JSON.stringify(schemaData)}
        </script>
      )}

      {/* Promotion Rich Snippets */}
      {activePromoSchemas.length > 0 && activePromoSchemas.map((promoSchema, idx) => (
        <script key={`promo-schema-${idx}`} type="application/ld+json">
          {JSON.stringify(promoSchema)}
        </script>
      ))}
    </Helmet>
  );
}

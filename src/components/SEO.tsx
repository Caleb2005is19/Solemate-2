import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schemaData?: object;
}

export function SEO({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  ogType = 'website',
  schemaData 
}: SEOProps) {
  const siteName = 'Solemate.co.ke';
  const fullTitle = title ? `${title} | ${siteName}` : siteName;
  const defaultDescription = 'Shop the latest premium sneakers, boots, and casual shoes at Solemate.co.ke. Fast delivery across Kenya, secure M-Pesa payments, and authentic footwear brands.';
  const metaDescription = description || defaultDescription;
  const url = typeof window !== 'undefined' ? window.location.href : 'https://solemate.co.ke';

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
    </Helmet>
  );
}

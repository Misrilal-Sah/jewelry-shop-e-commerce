import { Helmet } from 'react-helmet-async';

/**
 * SEO Component - Manages dynamic meta tags for each page
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (will be appended with " | Aabhar")
 * @param {string} props.description - Meta description (max 160 chars recommended)
 * @param {string} props.image - OG/Twitter image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - og:type (website, product, article)
 * @param {string} props.keywords - SEO keywords
 * @param {boolean} props.noindex - If true, adds noindex meta
 * @param {Object} props.product - Product data for structured data
 */
const SEO = ({ 
  title = 'Premium Indian Jewelry',
  description = 'Aabhar - Exquisite Gold, Diamond, Silver & Platinum Jewelry for Every Occasion. Discover timeless elegance with our handcrafted collection of rings, necklaces, earrings, and bangles.',
  image = 'https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/Aabhar-og-image.png',
  url,
  type = 'website',
  keywords = 'Aabhar, jewelry, gold, diamond, silver, platinum, rings, necklaces, earrings, bangles, bridal jewelry, Indian jewelry',
  noindex = false,
  product = null
}) => {
  const siteTitle = 'Aabhar';
  const fullTitle = title === 'Premium Indian Jewelry' ? `${siteTitle} | ${title}` : `${title} | ${siteTitle}`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Truncate description to 160 chars
  const truncatedDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description;

  // Generate product structured data (JSON-LD)
  const productStructuredData = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": product.images || [product.image],
    "brand": {
      "@type": "Brand",
      "name": "Aabhar"
    },
    "offers": {
      "@type": "Offer",
      "url": currentUrl,
      "priceCurrency": "INR",
      "price": product.price,
      "availability": product.stock > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Aabhar"
      }
    },
    ...(product.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.rating,
        "reviewCount": product.reviewCount || 1
      }
    }),
    "sku": product.sku || product.id,
    "category": product.category
  } : null;

  // Organization structured data for homepage
  const organizationStructuredData = type === 'website' ? {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Aabhar",
    "url": "https://Aabhar.com",
    "logo": "https://res.cloudinary.com/ddrlxvnsh/image/upload/v1766855787/jewllery_shop/logos/alankara-emblem.png",
    "description": "Premium Indian Jewelry Store",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-XXXXXXXXXX",
      "contactType": "customer service"
    }
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={truncatedDescription} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical URL */}
      {currentUrl && <link rel="canonical" href={currentUrl} />}
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={truncatedDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Aabhar" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={currentUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={truncatedDescription} />
      <meta name="twitter:image" content={image} />
      
      {/* Product-specific meta */}
      {product && (
        <>
          <meta property="product:price:amount" content={product.price} />
          <meta property="product:price:currency" content="INR" />
          <meta property="product:availability" content={product.stock > 0 ? 'in stock' : 'out of stock'} />
        </>
      )}
      
      {/* Structured Data - Product */}
      {productStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(productStructuredData)}
        </script>
      )}
      
      {/* Structured Data - Organization */}
      {organizationStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(organizationStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

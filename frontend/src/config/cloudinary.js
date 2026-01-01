// Cloudinary configuration and URLs
export const CLOUDINARY_CLOUD_NAME = 'ddrlxvnsh';
export const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Logo URLs
export const LOGO_EMBLEM = `${CLOUDINARY_BASE_URL}/v1766855787/jewllery_shop/logos/alankara-emblem.png`;
export const LOGO_DARK = `${CLOUDINARY_BASE_URL}/jewllery_shop/logos/Aabhar-logo-dark`;
export const LOGO_LIGHT = `${CLOUDINARY_BASE_URL}/jewllery_shop/logos/Aabhar-logo-light`;

// Placeholder image (using a Cloudinary transformation for a gray placeholder)
export const PLACEHOLDER_IMAGE = `${CLOUDINARY_BASE_URL}/c_fill,w_400,h_400,bo_1px_solid_gray/jewllery_shop/logos/alankara-emblem.png`;

// Helper function to get image URL (handles both Cloudinary and local paths)
export const getImageUrl = (path) => {
  if (!path) return PLACEHOLDER_IMAGE;
  if (path.startsWith('http')) return path;
  // Legacy local path - prepend backend URL
  return `http://localhost:5000${path}`;
};

// Product images base
export const PRODUCTS_BASE = `${CLOUDINARY_BASE_URL}/v1766855925/jewllery_shop/products`;

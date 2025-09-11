/**
 * Transforms new hero carousel data structure to legacy format
 * @param {Object} item - Hero carousel item with new structure
 * @returns {Object} - Item with legacy structure
 */
const transformToLegacyFormat = (item) => {
  const transformed = { ...item };

  // Extract first image URL as string
  if (item.images && item.images.length > 0) {
    transformed.image = item.images[0].url;
  } else {
    transformed.image = "";
  }

  // Convert full URL to relative path
  if (item.buttonLink) {
    try {
      const url = new URL(item.buttonLink);
      transformed.buttonLink = url.pathname + url.search + url.hash;
    } catch (error) {
      // If it's not a valid URL, keep as is
      transformed.buttonLink = item.buttonLink;
    }
  }

  // Remove the images array from the response
  delete transformed.images;

  return transformed;
};

/**
 * Batch transform multiple items to legacy format
 * @param {Array} items - Array of hero carousel items
 * @returns {Array} - Array of items with legacy structure
 */
const batchTransformToLegacyFormat = (items) => {
  return items.map(transformToLegacyFormat);
};

// Helper function to extract domain from URL
const extractPathFromUrl = (fullUrl) => {
  if (!fullUrl) return fullUrl;

  try {
    const url = new URL(fullUrl);
    return url.pathname + url.search + url.hash;
  } catch (error) {
    // If it's not a valid URL, return as is (might already be a path)
    return fullUrl;
  }
};

module.exports = {
  transformToLegacyFormat,
  batchTransformToLegacyFormat,
  extractPathFromUrl,
};

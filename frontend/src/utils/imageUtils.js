// Utility function to get product image URL
export const getProductImageUrl = (imageName, fallback = true) => {
  // If imageName is already a full URL, return it
  if (imageName && (imageName.startsWith('http://') || imageName.startsWith('https://'))) {
    return imageName;
  }

  // If imageName is a local path, use it
  if (imageName && imageName.startsWith('/')) {
    return imageName;
  }

  // If no image name provided and fallback is enabled, use placeholder
  if (fallback && !imageName) {
    return 'https://placehold.co/400x400/20b2aa/ffffff?text=Medicine';
  }

  // Try to construct path
  if (imageName) {
    return `/images/${imageName}`;
  }

  // Default placeholder
  return 'https://placehold.co/400x400/20b2aa/ffffff?text=Medicine';
};

// Get category-specific placeholder
export const getCategoryImage = (categoryName) => {
  const categoryImages = {
    'Medicines': 'https://placehold.co/400x400/20b2aa/ffffff?text=Medicine',
    'Baby Care': 'https://placehold.co/400x400/ff6b9d/ffffff?text=Baby+Care',
    'First Aid': 'https://placehold.co/400x400/e74c3c/ffffff?text=First+Aid',
    'Medical Devices': 'https://placehold.co/400x400/3498db/ffffff?text=Device',
    'Personal Care': 'https://placehold.co/400x400/9b59b6/ffffff?text=Personal+Care',
    'Vitamins & Supplements': 'https://placehold.co/400x400/f39c12/ffffff?text=Vitamins',
  };

  return categoryImages[categoryName] || categoryImages['Medicines'];
};


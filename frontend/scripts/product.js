/**
 * Product Script
 * Handles:
 * 1. Product data management
 * 2. Exporting products for filters
 * 3. Product operations (add to cart, add to wishlist, etc)
 */

// Sample products database
const productsDatabase = [
  {
    id: 1,
    name: 'Fresh Tomatoes',
    category: 'vegetables',
    harvestTime: 'harvested',
    price: 5000,
    province: 'Kigali City',
    district: 'Gasabo',
    image: '🍅',
    quantity: 500,
    farmer: 'John Doe'
  },
  {
    id: 2,
    name: 'Ripe Bananas',
    category: 'fruits',
    harvestTime: 'post-harvest',
    price: 3000,
    province: 'Northern',
    district: 'Musanze',
    image: '🍌',
    quantity: 300,
    farmer: 'Jane Smith'
  },
  {
    id: 3,
    name: 'Maize Grains',
    category: 'grains',
    harvestTime: 'harvested',
    price: 2000,
    province: 'Eastern',
    district: 'Kayonza',
    image: '🌽',
    quantity: 1000,
    farmer: 'Peter Johnson'
  },
  {
    id: 4,
    name: 'Carrots',
    category: 'vegetables',
    harvestTime: 'harvested',
    price: 4000,
    province: 'Kigali City',
    district: 'Kicukiro',
    image: '🥕',
    quantity: 400,
    farmer: 'Alice Brown'
  },
  {
    id: 5,
    name: 'Apples',
    category: 'fruits',
    harvestTime: 'post-harvest',
    price: 6000,
    province: 'Northern',
    district: 'Gicumbi',
    image: '🍎',
    quantity: 200,
    farmer: 'Bob Wilson'
  },
  {
    id: 6,
    name: 'Rice',
    category: 'grains',
    harvestTime: 'harvested',
    price: 3500,
    province: 'Eastern',
    district: 'Rwamagana',
    image: '🍚',
    quantity: 800,
    farmer: 'Mary Davis'
  },
  {
    id: 7,
    name: 'Lettuce',
    category: 'vegetables',
    harvestTime: 'pre-harvest',
    price: 2500,
    province: 'Kigali City',
    district: 'Nyarugenge',
    image: '🥬',
    quantity: 600,
    farmer: 'Tom Miller'
  },
  {
    id: 8,
    name: 'Oranges',
    category: 'fruits',
    harvestTime: 'post-harvest',
    price: 5500,
    province: 'Western',
    district: 'Rubavu',
    image: '🍊',
    quantity: 350,
    farmer: 'Sarah Taylor'
  },
  {
    id: 9,
    name: 'Beef',
    category: 'meat',
    harvestTime: 'post-harvest',
    price: 15000,
    province: 'Southern',
    district: 'Huye',
    image: '🥩',
    quantity: 50,
    farmer: 'James Anderson'
  },
  {
    id: 10,
    name: 'Fresh Milk',
    category: 'animal-products',
    harvestTime: 'harvested',
    price: 2000,
    province: 'Northern',
    district: 'Burera',
    image: '🥛',
    quantity: 200,
    farmer: 'Catherine Garcia'
  }
];

/**
 * Get all products
 * @returns {Array} Array of all products
 */
function getProducts() {
  return productsDatabase;
}

/**
 * Get product by ID
 * @param {Number} id - Product ID
 * @returns {Object|null} Product object or null if not found
 */
function getProductById(id) {
  return productsDatabase.find(product => product.id === id) || null;
}

/**
 * Get products by category
 * @param {String} category - Category name
 * @returns {Array} Array of products in the category
 */
function getProductsByCategory(category) {
  return productsDatabase.filter(product => product.category === category);
}

/**
 * Get products by district
 * @param {String} district - District name
 * @returns {Array} Array of products in the district
 */
function getProductsByDistrict(district) {
  return productsDatabase.filter(product => 
    product.district.toLowerCase() === district.toLowerCase()
  );
}

/**
 * Search products by name
 * @param {String} query - Search query
 * @returns {Array} Array of matching products
 */
function searchProducts(query) {
  const lowerQuery = query.toLowerCase();
  return productsDatabase.filter(product =>
    product.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get products by harvest time
 * @param {String} harvestTime - Harvest time (pre-harvest, post-harvest, harvested)
 * @returns {Array} Array of products with specified harvest time
 */
function getProductsByHarvestTime(harvestTime) {
  return productsDatabase.filter(product => product.harvestTime === harvestTime);
}

/**
 * Sort products by price
 * @param {Array} products - Array of products to sort
 * @param {String} order - Sort order ('asc' for low-to-high, 'desc' for high-to-low)
 * @returns {Array} Sorted array of products
 */
function sortProductsByPrice(products, order = 'asc') {
  const sorted = [...products];
  if (order === 'asc') {
    sorted.sort((a, b) => a.price - b.price);
  } else {
    sorted.sort((a, b) => b.price - a.price);
  }
  return sorted;
}

/**
 * Add a new product (for farmers)
 * @param {Object} productData - Product data to add
 * @returns {Object} Newly created product with ID
 */
function addProduct(productData) {
  const newProduct = {
    id: Math.max(...productsDatabase.map(p => p.id), 0) + 1,
    ...productData
  };
  productsDatabase.push(newProduct);
  return newProduct;
}

/**
 * Update a product
 * @param {Number} id - Product ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated product or null if not found
 */
function updateProduct(id, updates) {
  const product = getProductById(id);
  if (product) {
    Object.assign(product, updates);
    return product;
  }
  return null;
}

/**
 * Delete a product
 * @param {Number} id - Product ID
 * @returns {Boolean} True if deleted, false if not found
 */
function deleteProduct(id) {
  const index = productsDatabase.findIndex(p => p.id === id);
  if (index !== -1) {
    productsDatabase.splice(index, 1);
    return true;
  }
  return false;
}

// Export functions globally for use in other scripts
window.getProducts = getProducts;
window.getProductById = getProductById;
window.getProductsByCategory = getProductsByCategory;
window.getProductsByDistrict = getProductsByDistrict;
window.searchProducts = searchProducts;
window.getProductsByHarvestTime = getProductsByHarvestTime;
window.sortProductsByPrice = sortProductsByPrice;
window.addProduct = addProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;

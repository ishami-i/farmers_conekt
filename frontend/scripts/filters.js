/**
 * Filters Script
 * Handles:
 * 1. Loading location data (provinces and districts)
 * 2. Applying filters to products
 * 3. Displaying filtered results
 */

(function() {
  // Store all products and filter state
  let allProducts = [];
  let filteredProducts = [];
  let currentFilters = {
    category: 'all',
    harvestTime: 'all',
    price: 'all',
    province: 'all',
    district: 'all',
    quantity: 'all'
  };

  // ============= INITIALIZE FILTERS ON PAGE LOAD =============
  document.addEventListener('DOMContentLoaded', function() {
    loadLocationData();
    loadSampleProducts();
    renderProducts(allProducts);
  });
  
  // ============= APPLY FILTERS =============
  const applyFiltersBtn = document.getElementById('apply-filters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function() {
      // Get current filter values
      currentFilters.category = document.getElementById('category-filter').value;
      currentFilters.harvestTime = document.getElementById('harvest-time').value;
      currentFilters.price = document.getElementById('price-filter').value;
      currentFilters.province = document.getElementById('province-filter').value;
      currentFilters.district = document.getElementById('district-filter').value;
      currentFilters.quantity = document.getElementById('quantity-filter').value;

      // Apply filters
      applyAllFilters();
    });
  }

  // Filter products based on current filter state
  function applyAllFilters() {
    filteredProducts = allProducts.filter(product => {
      // Category filter
      if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
        return false;
      }

      // Harvest time filter
      if (currentFilters.harvestTime !== 'all' && product.harvestTime !== currentFilters.harvestTime) {
        return false;
      }

      // Price filter
      if (currentFilters.price === 'low-to-high') {
        // Will be sorted, not filtered
      } else if (currentFilters.price === 'high-to-low') {
        // Will be sorted, not filtered
      }

      // Province filter
      if (currentFilters.province !== 'all' && product.province !== currentFilters.province) {
        return false;
      }

      // District filter
      if (currentFilters.district !== 'all' && product.district !== currentFilters.district) {
        return false;
      }

      // Quantity filter
      if (currentFilters.quantity !== 'all' && product.quantity !== currentFilters.quantity) {
        return false;
      }

      return true;
    });

    // Apply sorting if price filter is selected
    if (currentFilters.price === 'low-to-high') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (currentFilters.price === 'high-to-low') {
      filteredProducts.sort((a, b) => b.price - a.price);
    }

    // Render filtered products
    renderProducts(filteredProducts);
  }

  // ============= RENDER PRODUCTS =============
  function renderProducts(products) {
    const productsContainer = document.getElementById('products-container');
    
    if (!productsContainer) {
      console.error('Products container not found');
      return;
    }

    if (products.length === 0) {
      productsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 3rem; text-align: center; color: var(--text-light);">
          <div style="font-size: 2rem; margin-bottom: 1rem;">🌾</div>
          <h3 style="color: var(--text-dark); margin-bottom: 0.5rem;">No products found</h3>
          <p>Try adjusting your filters to see more products</p>
        </div>
      `;
      return;
    }

    // Generate product cards HTML
    productsContainer.innerHTML = products.map(product => `
      <div class="product-card">
        <div class="product-image">
          <img src="${product.image}" alt="${product.name}" onerror="this.src='../styles/placeholder.jpg'"/>
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-category">Category: ${capitalizeFirst(product.category)}</p>
          <p class="product-harvest-time">Harvest Time: ${capitalizeFirst(product.harvestTime)}</p>
          <p class="product-price">Price: ${product.price} RWF per unit</p>
          <p class="product-location">Location: ${product.province}, ${product.district}</p>
          <p class="product-quantity">Quantity Available: ${capitalizeFirst(product.quantity)}</p>
          <div class="product-actions">
            <button class="btn-view">👁 View Details</button>
            <button class="btn-cart">🛒 Add to Cart</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Helper function to capitalize first letter
  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).replace('-', ' ');
  }

  // Export functions for external use if needed
  window.applyFilters = applyAllFilters;
  window.filterProducts = { 
    setProducts: (products) => { allProducts = products; },
    render: renderProducts 
  };
})();
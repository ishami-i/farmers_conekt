/**
 * Filters Script
 * Handles:
 * 1. Loading location data (districts from location.json)
 * 2. Searchable district input with autocomplete
 * 3. Applying filters to products (search, category, harvest time, price, district)
 * 4. Displaying filtered results
 */

(function() {
  // Store all products and filter state
  let allProducts = [];
  let filteredProducts = [];
  let allDistricts = [];
  
  let currentFilters = {
    search: '',
    category: 'all',
    harvestTime: 'all',
    price: 'all',
    district: 'all'
  };

  // ============= INITIALIZE FILTERS ON PAGE LOAD =============
  document.addEventListener('DOMContentLoaded', function() {
    loadLocationData();
    loadSampleProducts();
    setupDistrictAutocomplete();
    setupSearchInput();
    renderProducts(allProducts);
  });

  // ============= LOAD LOCATION DATA FROM JSON =============
  function loadLocationData() {
    fetch('../data/locations.json')
      .then(response => response.json())
      .then(data => {
        // Extract all districts from all provinces
        allDistricts = [];
        Object.values(data).forEach(province => {
          Object.keys(province).forEach(district => {
            if (!allDistricts.includes(district)) {
              allDistricts.push(district);
            }
          });
        });
        allDistricts.sort();
      })
      .catch(error => {
        console.error('Error loading location data:', error);
        // Fallback districts if JSON fails to load
        allDistricts = ['Kigali', 'Gasabo', 'Kicukiro', 'Nyarugenge', 'Burera', 'Gakenke'];
      });
  }

  // ============= DISTRICT AUTOCOMPLETE =============
  function setupDistrictAutocomplete() {
    const districtInput = document.getElementById('district-filter');
    const suggestionsContainer = document.getElementById('district-suggestions');

    if (!districtInput) return;

    districtInput.addEventListener('input', function(e) {
      const value = e.target.value.toLowerCase().trim();
      
      if (value.length === 0) {
        suggestionsContainer.style.display = 'none';
        currentFilters.district = 'all';
        return;
      }

      // Filter districts matching input
      const matches = allDistricts.filter(district =>
        district.toLowerCase().includes(value)
      );

      if (matches.length > 0) {
        // Create suggestion items
        suggestionsContainer.innerHTML = matches
          .slice(0, 8) // Limit to 8 suggestions
          .map(district => `
            <div class="district-suggestion-item" onclick="selectDistrict('${district}')">
              ${district}
            </div>
          `).join('');
        suggestionsContainer.style.display = 'block';
      } else {
        suggestionsContainer.innerHTML = '<div class="district-suggestion-item disabled">No districts found</div>';
        suggestionsContainer.style.display = 'block';
      }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('#district-filter') && !e.target.closest('#district-suggestions')) {
        suggestionsContainer.style.display = 'none';
      }
    });
  }

  // ============= SELECT DISTRICT FROM SUGGESTIONS =============
  window.selectDistrict = function(district) {
    document.getElementById('district-filter').value = district;
    document.getElementById('district-suggestions').style.display = 'none';
    currentFilters.district = district;
  };

  // ============= PRODUCT SEARCH SETUP =============
  function setupSearchInput() {
    const searchInput = document.getElementById('search-products');
    
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        currentFilters.search = e.target.value.toLowerCase().trim();
        applyAllFilters();
      });
    }
  }

  // ============= APPLY FILTERS =============
  const applyFiltersBtn = document.getElementById('apply-filters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function() {
      // Get current filter values
      currentFilters.category = document.getElementById('category-filter').value;
      currentFilters.harvestTime = document.getElementById('harvest-time').value;
      currentFilters.price = document.getElementById('price-filter').value;
      
      const districtInput = document.getElementById('district-filter').value.toLowerCase().trim();
      currentFilters.district = districtInput || 'all';

      // Apply filters
      applyAllFilters();
    });
  }

  // ============= FILTER PRODUCTS BASED ON CURRENT FILTER STATE =============
  function applyAllFilters() {
    filteredProducts = allProducts.filter(product => {
      // Search filter - search in product name
      if (currentFilters.search && !product.name.toLowerCase().includes(currentFilters.search)) {
        return false;
      }

      // Category filter
      if (currentFilters.category !== 'all' && product.category !== currentFilters.category) {
        return false;
      }

      // Harvest time filter
      if (currentFilters.harvestTime !== 'all' && product.harvestTime !== currentFilters.harvestTime) {
        return false;
      }

      // District filter (case-insensitive)
      if (currentFilters.district !== 'all') {
        if (!product.district || product.district.toLowerCase() !== currentFilters.district.toLowerCase()) {
          return false;
        }
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
          <p class="product-location">Location: ${product.province || 'N/A'}, ${product.district || 'N/A'}</p>
          <div class="product-actions">
            <button class="btn-view">👁 View Details</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============= LOAD SAMPLE PRODUCTS (from product.js) =============
  function loadSampleProducts() {
    // Products will be loaded from product.js if available
    if (window.getProducts && typeof window.getProducts === 'function') {
      allProducts = window.getProducts();
    } else {
      // Fallback sample products
      allProducts = [
        {
          name: 'Fresh Tomatoes',
          category: 'vegetables',
          harvestTime: 'harvested',
          price: 5000,
          province: 'Kigali City',
          district: 'Gasabo',
          image: '🍅'
        },
        {
          name: 'Bananas',
          category: 'fruits',
          harvestTime: 'post-harvest',
          price: 3000,
          province: 'Northern',
          district: 'Musanze',
          image: '🍌'
        },
        {
          name: 'Maize',
          category: 'grains',
          harvestTime: 'harvested',
          price: 2000,
          province: 'Eastern',
          district: 'Kayonza',
          image: '🌽'
        }
      ];
    }
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
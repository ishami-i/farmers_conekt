/**
 * Filters Script
 * Handles:
 * 1. Loading location data (districts from district.json)
 * 2. District selection filter
 * 3. Applying filters to products (search, category, harvest time, price, district)
 * 4. Displaying filtered results
 */

(function() {
  // Store all products and filter state
  let allProducts = [];
  let filteredProducts = [];
  let allDistricts = [];
  let selectedDistricts = [];
  
  let currentFilters = {
    search: '',
    category: 'all',
    harvestTime: 'all',
    price: 'all',
    districts: []
  };

  // ============= INITIALIZE FILTERS ON PAGE LOAD =============
  document.addEventListener('DOMContentLoaded', function() {
    loadDistrictsFromJSON();
    loadSampleProducts();
    setupSearchInput();
    setupSearchButton();
    setupDistrictFilter();
    setupApplyFiltersButton();
    renderProducts(allProducts);
  });

  // ============= LOAD DISTRICTS FROM district.json =============
  async function loadDistrictsFromJSON() {
    try {
      // Adjust path based on current page location
      // From frontend/pages/ we need to go up two levels (../../) to reach the root date folder
      // From frontend/ we need to go up one level (../)
      const basePath = window.location.pathname.includes('/pages/') ? '../../' : '../';
      const response = await fetch(basePath + 'data/district.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load districts: ${response.status}`);
      }
      
      const data = await response.json();
      allDistricts = data.districts || [];
    } catch (err) {
      console.error("Couldn't load districts, using fallback list.", err);
      // Fallback to hardcoded districts if JSON load fails
      allDistricts = [
        "Bugesera", "Burera", "Gakenke", "Gasabo", "Gatsibo", "Gicumbi", "Gisagara", "Huye", 
        "Kamonyi", "Karongi", "Kayonza", "Kicukiro", "Kirehe", "Muhanga", "Musanze", "Ngoma", 
        "Ngororero", "Nyabihu", "Nyagatare", "Nyamagabe", "Nyamasheke", "Nyanza", "Nyarugenge", 
        "Nyaruguru", "Rubavu", "Ruhango", "Rulindo", "Rusizi", "Rutsiro", "Rwamagana"
      ];
    } finally {
      // Sort alphabetically for consistent display
      allDistricts.sort();
      populateDistrictSelect();
    }
  }

  // ============= POPULATE DISTRICT SELECT DROPDOWN =============
  function populateDistrictSelect() {
    const districtSelect = document.getElementById('districtSelect');
    
    if (!districtSelect) {
      // Silent return if element doesn't exist on this page
      return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    // Create default option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "-- Choose District --";
    fragment.appendChild(defaultOption);

    // Add districts from array
    if (Array.isArray(allDistricts)) {
      allDistricts.forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        fragment.appendChild(option);
      });
    }

    // Clear existing and append new options
    districtSelect.innerHTML = '';
    districtSelect.appendChild(fragment);
  }

  // ============= DISTRICT FILTER SETUP =============
  function setupDistrictFilter() {
    const districtSelect = document.getElementById('districtSelect');
    
    if (districtSelect) {
      districtSelect.addEventListener('change', function() {
        const selectedValue = this.value;
        
        if (selectedValue === '') {
          selectedDistricts = [];
        } else {
          // Single selection mode
          selectedDistricts = [selectedValue];
        }
        
        currentFilters.districts = selectedDistricts;
      });
    }
  }

  // ============= PRODUCT SEARCH SETUP =============
  function setupSearchInput() {
    const searchInput = document.getElementById('search-products');
    
    if (searchInput) {
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          performSearch();
        }
      });
    }
  }

  // ============= SEARCH BUTTON SETUP =============
  function setupSearchButton() {
    const searchBtn = document.getElementById('search-btn');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }
  }

  // ============= PERFORM SEARCH =============
  function performSearch() {
    const searchInput = document.getElementById('search-products');
    
    if (!searchInput) {
      return;
    }
    
    // Update all filters from DOM to ensure consistency
    updateFiltersFromDOM();
    
    // Update search term
    currentFilters.search = searchInput.value.toLowerCase().trim();
    
    // Apply
    applyAllFilters();
  }

  // ============= UPDATE FILTERS FROM DOM =============
  function updateFiltersFromDOM() {
    const categoryEl = document.getElementById('category-filter');
    const harvestEl = document.getElementById('harvest-time');
    const priceEl = document.getElementById('price-filter');
    const districtEl = document.getElementById('districtSelect');

    if (categoryEl) currentFilters.category = categoryEl.value;
    if (harvestEl) currentFilters.harvestTime = harvestEl.value;
    if (priceEl) currentFilters.price = priceEl.value;
    
    if (districtEl) {
       const val = districtEl.value;
       // Sync selectedDistricts var for consistency
       selectedDistricts = val ? [val] : [];
       currentFilters.districts = selectedDistricts;
    }
  }

  // ============= APPLY FILTERS BUTTON SETUP =============
  function setupApplyFiltersButton() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', function() {
        // Update all filter values from DOM
        updateFiltersFromDOM();

        // Preserve current search value if it exists in the input
        const searchInput = document.getElementById('search-products');
        if (searchInput) {
          currentFilters.search = searchInput.value.toLowerCase().trim();
        }

        // Apply filters
        applyAllFilters();
      });
    }
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

      // District filter - if districts are selected, product must match one
      if (currentFilters.districts && currentFilters.districts.length > 0) {
        const productDistrict = product.district || '';
        if (!currentFilters.districts.some(d => d.toLowerCase() === productDistrict.toLowerCase())) {
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
          <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" onerror="this.src='../styles/placeholder.jpg'"/>
        </div>
        <div class="product-info">
          <h3 class="product-name">${escapeHTML(product.name)}</h3>
          <p class="product-category">Category: ${escapeHTML(capitalizeFirst(product.category))}</p>
          <p class="product-harvest-time">Harvest Time: ${escapeHTML(capitalizeFirst(product.harvestTime))}</p>
          <p class="product-price">Price: ${escapeHTML(product.price)} RWF per unit</p>
          <p class="product-location">Location: ${escapeHTML(product.province || 'N/A')}, ${escapeHTML(product.district || 'N/A')}</p>
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

  // ============= HELPER FUNCTIONS =============
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function capitalizeFirst(str) {
    if (!str) return '';
    // Replace all hyphens with spaces and capitalize the first letter
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
  }

  // Export functions for external use if needed
  window.applyFilters = applyAllFilters;
  window.filterProducts = { 
    setProducts: (products) => { allProducts = products; },
    render: renderProducts,
    getDistricts: () => allDistricts
  };
})();
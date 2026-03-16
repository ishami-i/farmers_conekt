/**
 * Buyer Dashboard Script
 * Handles:
 * 1. Cart management (add, remove, update quantity)
 * 2. Orders tracking
 * 3. Wishlist management
 * 4. Tab switching and navigation
 * 5. User profile management
 * 6. Data persistence with localStorage
 * 7. Product browsing and filtering
 */

let cart = [];
let orders = [];
let wishlist = [];
let allProducts = [];
let currentOrderFilter = 'all';

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', function() {
    loadBuyerData();
    displayUserInfo();
    loadAvailableProducts();
    setupProductFilters();
    render();
});

// ============= LOAD AVAILABLE PRODUCTS =============
function loadAvailableProducts() {
    // In a real app, this would fetch from a server
    // For now, we'll create sample products that would come from farmers
    const sampleProducts = [
        {
            id: 1,
            name: 'Fresh Tomatoes',
            category: 'vegetables',
            price: 500,
            quantity: '100kg',
            location: 'Kigali, Gasabo',
            farmer: 'John Farmer',
            image: '🍅',
            harvestTime: 'post-harvest',
            description: 'Fresh, organic tomatoes harvested this morning'
        },
        {
            id: 2,
            name: 'Bananas',
            category: 'fruits',
            price: 800,
            quantity: '50kg',
            location: 'Musanze',
            farmer: 'Mary cultivator',
            image: '🍌',
            harvestTime: 'harvested',
            description: 'Sweet, ripe bananas from mountain region'
        },
        {
            id: 3,
            name: 'Lettuce',
            category: 'vegetables',
            price: 1000,
            quantity: '30kg',
            location: 'Muhanga',
            farmer: 'Peter Green',
            image: '🥬',
            harvestTime: 'post-harvest',
            description: 'Crisp, fresh lettuce for salads'
        },
        {
            id: 4,
            name: 'Potatoes',
            category: 'vegetables',
            price: 400,
            quantity: '200kg',
            location: 'Nyaruguru',
            farmer: 'Alice Root',
            image: '🥔',
            harvestTime: 'harvested',
            description: 'High-quality potatoes, perfect for cooking'
        },
        {
            id: 5,
            name: 'Carrots',
            category: 'vegetables',
            price: 600,
            quantity: '80kg',
            location: 'Gisagara',
            farmer: 'Robert Soil',
            image: '🥕',
            harvestTime: 'post-harvest',
            description: 'Sweet, crunchy carrots, great nutritional value'
        },
        {
            id: 6,
            name: 'Pumpkin',
            category: 'vegetables',
            price: 700,
            quantity: '120kg',
            location: 'Huye',
            farmer: 'Sarah Garden',
            image: '🎃',
            harvestTime: 'harvested',
            description: 'Large, fresh pumpkins ready to harvest'
        },
        {
            id: 7,
            name: 'Apples',
            category: 'fruits',
            price: 1200,
            quantity: '40kg',
            location: 'Musanze',
            farmer: 'David Orchard',
            image: '🍎',
            harvestTime: 'post-harvest',
            description: 'Fresh apples with natural sweetness'
        },
        {
            id: 8,
            name: 'Maize',
            category: 'grains',
            price: 300,
            quantity: '300kg',
            location: 'Gicumbi',
            farmer: 'James Field',
            image: '🌽',
            harvestTime: 'harvested',
            description: 'Quality maize, suitable for milling or cooking'
        }
    ];

    allProducts = sampleProducts;
    renderBuyerProducts(allProducts);
}

// ============= SETUP PRODUCT FILTERS =============
function setupProductFilters() {
    const categoryFilter = document.getElementById('product-category-filter');
    const priceFilter = document.getElementById('product-price-filter');
    const searchInput = document.getElementById('product-search');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndRenderProducts);
    }
    if (priceFilter) {
        priceFilter.addEventListener('change', filterAndRenderProducts);
    }
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderProducts);
    }
}

// ============= FILTER AND RENDER PRODUCTS =============
function filterAndRenderProducts() {
    const category = document.getElementById('product-category-filter').value;
    const priceSort = document.getElementById('product-price-filter').value;
    const search = document.getElementById('product-search').value.toLowerCase();

    let filtered = allProducts.filter(product => {
        const matchCategory = category === 'all' || product.category === category;
        const matchSearch = product.name.toLowerCase().includes(search) ||
                          product.farmer.toLowerCase().includes(search) ||
                          product.location.toLowerCase().includes(search);
        return matchCategory && matchSearch;
    });

    // Apply price sorting
    if (priceSort === 'low-to-high') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'high-to-low') {
        filtered.sort((a, b) => b.price - a.price);
    }

    renderBuyerProducts(filtered);
}

// ============= RENDER BUYER PRODUCTS =============
function renderBuyerProducts(products) {
    const container = document.getElementById('buyer-products-container');
    
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <div class="empty-icon">🌾</div>
                <div class="empty-text">No products match your search</div>
                <div class="empty-sub">Try adjusting your filters or search terms</div>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image" style="font-size: 4rem;">
                ${product.image}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category.toUpperCase()}</p>
                <p class="product-details" style="font-size: 0.85rem; color: var(--text-light); margin: 0.5rem 0;">
                    From: <strong>${product.farmer}</strong>
                </p>
                <p class="product-details" style="font-size: 0.85rem; color: var(--text-light); margin: 0.5rem 0;">
                    📍 ${product.location}
                </p>
                <p class="product-details" style="font-size: 0.85rem; color: var(--text-light);">
                    ${product.quantity} available
                </p>
                <div class="product-price">${product.price.toLocaleString()} RWF/unit</div>
                <div class="product-actions">
                    <button class="btn-view" onclick="addToCart('${product.name}', '${product.farmer}', ${product.price}, '${product.location}', ${product.quantity.split('kg')[0]})">
                        🛒 Add to Cart
                    </button>
                    <button class="btn-cart" onclick="addToWishlist('${product.name}', '${product.farmer}', ${product.price}, '${product.location}', ${product.quantity.split('kg')[0]})">
                        ♡ Wishlist
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ============= USER DATA MANAGEMENT =============
function loadBuyerData() {
    // Load from localStorage
    const savedCart = localStorage.getItem('buyerCart');
    const savedOrders = localStorage.getItem('buyerOrders');
    const savedWishlist = localStorage.getItem('buyerWishlist');

    cart = savedCart ? JSON.parse(savedCart) : [];
    orders = savedOrders ? JSON.parse(savedOrders) : [];
    wishlist = savedWishlist ? JSON.parse(savedWishlist) : [];
}

function saveBuyerData() {
    localStorage.setItem('buyerCart', JSON.stringify(cart));
    localStorage.setItem('buyerOrders', JSON.stringify(orders));
    localStorage.setItem('buyerWishlist', JSON.stringify(wishlist));
}

function displayUserInfo() {
    const session = window.getSession ? window.getSession() : null;
    if (session) {
        const email = session.email;
        const name = email.split('@')[0];
        document.getElementById('buyer-email').textContent = email;
        document.getElementById('profile-email').value = email;
        document.querySelector('.topbar-left h2').textContent = `Welcome, ${name}!`;
    }
}

// ============= TAB SWITCHING =============
function switchTab(tabName, element) {
    if (element) {
        element.preventDefault();
    }

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    const tab = document.getElementById(tabName + '-tab');
    if (tab) {
        tab.classList.add('active');
    }

    // Mark nav item as active
    if (element) {
        element.closest('.nav-item').classList.add('active');
    }

    // Update page title
    const titles = {
        dashboard: 'Buyer Dashboard',
        products: 'Browse Fresh Products',
        cart: 'Shopping Cart',
        orders: 'My Orders',
        wishlist: 'My Wishlist',
        profile: 'My Profile'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';

    const subtitles = {
        dashboard: 'Welcome back to your shopping hub',
        products: 'Find quality products from local farmers',
        cart: 'Review and manage your items',
        orders: 'Track and manage your orders',
        wishlist: 'Products you\'re interested in',
        profile: 'Manage your account information'
    };
    document.getElementById('page-subtitle').textContent = subtitles[tabName] || '';

    render();
}

// ============= RENDERING =============
function render() {
    updateStats();
    renderCart();
    renderOrders();
    renderWishlist();
    renderDashboardOrders();
}

function updateStats() {
    document.getElementById('stat-cart').textContent = cart.length;
    document.getElementById('stat-orders').textContent = orders.length;
    document.getElementById('stat-wishlist').textContent = wishlist.length;
    
    const delivered = orders.filter(o => o.status === 'delivered').length;
    document.getElementById('stat-delivered').textContent = delivered;

    // Update cart badge
    const badge = document.getElementById('cart-badge');
    if (cart.length > 0) {
        badge.textContent = cart.length;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

function renderCart() {
    const container = document.getElementById('cart-items');
    const summary = document.getElementById('cart-summary');

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <div class="empty-text">Your cart is empty</div>
                <div class="empty-sub">Add some fresh produce to get started</div>
                <button class="empty-cta" onclick="switchTab('products', null)">🌾 Browse Products</button>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }

    container.innerHTML = cart.map((item, idx) => `
        <div class="item-card">
            <div class="item-image">🥬</div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-farmer">From: ${item.farmer}</div>
                <div class="item-meta">
                    <span>${item.quantity}kg</span>
                    <span>${item.location}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="text-align: right;">
                    <div class="item-quantity">
                        <button class="qty-btn" onclick="updateCartQuantity(${idx}, -1)">−</button>
                        <span>${item.qty || 1}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${idx}, 1)">+</button>
                    </div>
                    <div class="item-price">${(item.price * (item.qty || 1)).toLocaleString()} RWF</div>
                </div>
                <button class="btn-small danger" onclick="removeFromCart(${idx})">Remove</button>
            </div>
        </div>
    `).join('');

    // Show summary
    const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    summary.innerHTML = `
        <div class="cart-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${total.toLocaleString()} RWF</span>
            </div>
            <div class="summary-row">
                <span>Delivery Fee:</span>
                <span>5,000 RWF</span>
            </div>
            <div class="summary-row">
                <span>Tax:</span>
                <span>${Math.round(total * 0.05).toLocaleString()} RWF</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>${(total + 5000 + Math.round(total * 0.05)).toLocaleString()} RWF</span>
            </div>
            <button class="checkout-btn" onclick="checkout()">🛍 Proceed to Checkout</button>
        </div>
    `;
    summary.style.display = 'block';
}

function renderOrders() {
    const container = document.getElementById('orders-list');
    let filteredOrders = orders;

    if (currentOrderFilter !== 'all') {
        filteredOrders = orders.filter(o => o.status === currentOrderFilter);
    }

    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <div class="empty-text">No orders found</div>
                <div class="empty-sub">You haven't placed any orders yet</div>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredOrders.map(order => {
        const statusClass = `badge-${order.status}`;
        return `
            <div class="item-card">
                <div class="item-image" style="font-size: 1.5rem;">📦</div>
                <div class="item-details">
                    <div class="item-name">Order #${order.id}</div>
                    <div class="item-farmer">${order.items.length} item(s)</div>
                    <div class="item-meta">
                        <span>Placed: ${new Date(order.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <span class="status-badge ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    <div class="item-price">${order.total.toLocaleString()} RWF</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderWishlist() {
    const container = document.getElementById('wishlist-items');

    if (wishlist.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">♡</div>
                <div class="empty-text">Your wishlist is empty</div>
                <div class="empty-sub">Add products you'd like to buy later</div>
                <button class="empty-cta" onclick="switchTab('products', null)">🌾 Browse Products</button>
            </div>
        `;
        return;
    }

    container.innerHTML = wishlist.map((item, idx) => `
        <div class="item-card">
            <div class="item-image">🥬</div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-farmer">From: ${item.farmer}</div>
                <div class="item-meta">
                    <span>${item.quantity}kg available</span>
                    <span>${item.location}</span>
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                <div class="item-price">${item.price.toLocaleString()} RWF</div>
                <button class="btn-small" onclick="addToCart('${item.name}', '${item.farmer}', ${item.price}, '${item.location}', ${item.quantity})">Add to Cart</button>
                <button class="btn-small danger" onclick="removeFromWishlist(${idx})">Remove</button>
            </div>
        </div>
    `).join('');
}

function renderDashboardOrders() {
    const container = document.getElementById('dashboard-orders');
    const recentOrders = orders.slice(-3).reverse();

    if (recentOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">No orders yet</div>
                <div class="empty-sub">Start shopping to place your first order</div>
                <button class="empty-cta" onclick="switchTab('products', null)">🌾 Browse Products</button>
            </div>
        `;
        return;
    }

    container.innerHTML = recentOrders.map(order => {
        const statusClass = `badge-${order.status}`;
        return `
            <div class="item-card">
                <div class="item-image" style="font-size: 1.5rem;">📦</div>
                <div class="item-details">
                    <div class="item-name">Order #${order.id}</div>
                    <div class="item-farmer">${order.items.length} item(s)</div>
                    <div class="item-meta">
                        <span>${new Date(order.date).toLocaleDateString()}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                    <span class="status-badge ${statusClass}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    <div class="item-price">${order.total.toLocaleString()} RWF</div>
                </div>
            </div>
        `;
    }).join('');
}

// ============= CART OPERATIONS =============
function addToCart(name, farmer, price, location, quantity) {
    const existingItem = cart.find(item => item.name === name && item.farmer === farmer);
    
    if (existingItem) {
        existingItem.qty = (existingItem.qty || 1) + 1;
    } else {
        cart.push({ name, farmer, price, location, quantity, qty: 1 });
    }

    saveBuyerData();
    render();
    showToast(`${name} added to cart!`);
}

function updateCartQuantity(idx, change) {
    const newQty = (cart[idx].qty || 1) + change;
    if (newQty <= 0) {
        removeFromCart(idx);
    } else {
        cart[idx].qty = newQty;
        saveBuyerData();
        render();
    }
}

function removeFromCart(idx) {
    const item = cart[idx];
    cart.splice(idx, 1);
    saveBuyerData();
    render();
    showToast(`${item.name} removed from cart`);
}

function checkout() {
    if (cart.length === 0) {
        showToast('Your cart is empty');
        return;
    }

    const orderId = 'ORD-' + Date.now();
    const total = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0) + 5000 + Math.round(cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0) * 0.05);

    const order = {
        id: orderId,
        date: new Date().toISOString(),
        items: cart.map(item => ({ ...item, qty: item.qty || 1 })),
        total: total,
        status: 'pending'
    };

    orders.unshift(order);
    cart = [];
    saveBuyerData();
    render();
    switchTab('orders', null);
    showToast('Order placed successfully! 🎉');
}

// ============= WISHLIST OPERATIONS =============
function addToWishlist(name, farmer, price, location, quantity) {
    const exists = wishlist.find(item => item.name === name && item.farmer === farmer);
    if (!exists) {
        wishlist.push({ name, farmer, price, location, quantity });
        saveBuyerData();
        render();
        showToast(`${name} added to wishlist!`);
    } else {
        showToast(`${name} is already in your wishlist`);
    }
}

function removeFromWishlist(idx) {
    const item = wishlist[idx];
    wishlist.splice(idx, 1);
    saveBuyerData();
    render();
    showToast(`${item.name} removed from wishlist`);
}

// ============= ORDER FILTERING =============
function filterOrders(status) {
    currentOrderFilter = status;

    // Update active button
    document.querySelectorAll('#orders-tab .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    renderOrders();
}

// ============= PROFILE OPERATIONS =============
function saveProfile() {
    const name = document.getElementById('profile-name').value;
    const phone = document.getElementById('profile-phone').value;
    const location = document.getElementById('profile-location').value;

    localStorage.setItem('buyerProfile', JSON.stringify({ name, phone, location }));
    showToast('Profile updated successfully! ✓');
}

// ============= UTILITIES =============
function previewAvatar(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        const img = document.getElementById('avatar-preview');
        img.src = ev.target.result;
        img.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function showToast(msg) {
    const t = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3200);
}

function confirmLogout() {
    if (confirm('Are you sure you want to log out?')) {
        showToast('Logging out...');
        setTimeout(() => { window.logoutUser(); }, 1500);
    }
}
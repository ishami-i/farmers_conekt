/**
 * Buyer Dashboard Script
 * Handles:
 * 1. Cart management (add, remove, update quantity)
 * 2. Orders tracking
 * 3. Wishlist management
 * 4. Tab switching and navigation
 * 5. User profile management
 * 6. Data persistence with localStorage
 * 7. Mobile sidebar toggle
 */

let cart = [];
let orders = [];
let wishlist = [];
let currentOrderFilter = 'all';

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', function() {
    loadBuyerData();
    displayUserInfo();
    render();
    setupSidebarToggle();
});

// ============= SIDEBAR TOGGLE (Mobile) =============
function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // Create toggle button if it doesn't exist
    let toggleBtn = document.querySelector('.sidebar-toggle-btn');
    if (!toggleBtn) {
        toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
        const header = document.getElementById('header');
        header.appendChild(toggleBtn);
    }

    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Close sidebar on window resize if screen is large
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 1024) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    });
}

function closeSidebarOnMobile() {
    if (window.innerWidth < 1024) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
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
    if (element && element.preventDefault) {
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
    if (element && element.closest) {
        const navItem = element.closest('.nav-item');
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    // Update page title
    const titles = {
        dashboard: 'Buyer Dashboard',
        cart: 'Shopping Cart',
        orders: 'My Orders',
        wishlist: 'My Wishlist',
        profile: 'My Profile'
    };
    document.getElementById('page-title').textContent = titles[tabName] || 'Dashboard';

    const subtitles = {
        dashboard: 'Welcome back to your shopping hub',
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
                <button class="empty-cta" onclick="window.location.href='./home.html'">🌾 Browse Products</button>
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
                <button class="empty-cta" onclick="window.location.href='./home.html'">🌾 Browse Products</button>
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
                <button class="empty-cta" onclick="window.location.href='./home.html'">🌾 Browse Products</button>
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.qty || 1)), 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + 5000 + tax;

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
    if (event && event.target) {
        event.target.classList.add('active');
    }

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
        setTimeout(() => { 
            if (window.logoutUser) {
                window.logoutUser();
            } else {
                window.location.href = './login.html';
            }
        }, 1500);
    }
}
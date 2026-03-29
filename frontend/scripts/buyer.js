/**
 * Buyer Dashboard Script
 * Handles:
 * 1. Cart management (add, remove, update quantity)
 * 2. Orders tracking and making orders
 * 4. Tab switching and navigation
 * 5. User profile management
 * 6. Data persistence with localStorage
 * 7. Mobile sidebar toggle
 */

let cart = [];
let orders = [];
let currentOrderFilter = "all";
let products = []; // Add products array for API data

const API_BASE = window.API_BASE_URL || "http://localhost:5000";

function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  options.headers = options.headers || {};
  if (!options.headers["Content-Type"] && !(options.body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
  }
  if (token) {
    options.headers["Authorization"] = "Bearer " + token;
  }
  return fetch(API_BASE + path, options).then(async (res) => {
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      // ignore
    }
    if (!res.ok) {
      const message = (body && (body.error || body.message)) || res.statusText;
      throw new Error(message);
    }
    return body;
  });
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("session") || "null");
  } catch (e) {
    return null;
  }
}
window.getSession = getSession;

// log in checking 
document.addEventListener("DOMContentLoaded", async function () {
  loadBuyerData();
  updateCartBadge();
  loadProductsFromAPI();

  const session = getSession();
  if (!session) {
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    window.location.href = `./login.html?redirect=${returnUrl}`;
    return;
  }

  document.body.classList.add("logged-in");

  displayUserInfo();
  await loadOrdersFromAPI();
  render();
  setupSidebarToggle();

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam) {
    switchTab(tabParam, null);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const tx_ref = urlParams.get("tx_ref");
  if (tx_ref) {
    verifyPayment(tx_ref);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
});

//  SIDEBAR TOGGLE (Mobile) 
function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  if (!sidebar || !overlay) return;

  let toggleBtn = document.getElementById("toggle-button");
  if (!toggleBtn) {
    toggleBtn = document.querySelector(".sidebar-toggle-btn");
    if (!toggleBtn) {
      toggleBtn = document.createElement("button");
      toggleBtn.className = "sidebar-toggle-btn";
      toggleBtn.innerHTML = "☰";
      toggleBtn.setAttribute("aria-label", "Toggle sidebar");
      const header = document.getElementById("header");
      if (header) header.appendChild(toggleBtn);
    }
  }

  toggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    const isActive = sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
    toggleBtn.classList.toggle("active", isActive);
    toggleBtn.setAttribute("aria-expanded", isActive ? "true" : "false");
  });

  if (overlay) {
    overlay.addEventListener("click", function () {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      toggleBtn.classList.remove("active");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  }

  // Close sidebar on window resize if screen is large
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      toggleBtn.classList.remove("active");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  });
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggleBtn = document.getElementById("toggle-button");
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
    if (toggleBtn) {
      toggleBtn.classList.remove("active");
      toggleBtn.setAttribute("aria-expanded", "false");
    }
  }
}

// user data management
// loading data from local storage
function loadBuyerData() {
  const savedCart =
    localStorage.getItem("buyerCart") ||
    localStorage.getItem("cart") ||
    localStorage.getItem("shoppingCart");
  const savedOrders =
    localStorage.getItem("buyerOrders") ||
    localStorage.getItem("orders") ||
    localStorage.getItem("orderHistory");

  try {
    cart = savedCart ? JSON.parse(savedCart) : [];
  } catch (e) {
    cart = [];
  }

  try {
    orders = savedOrders ? JSON.parse(savedOrders) : [];
  } catch (e) {
    orders = [];
  }
}

function saveBuyerData() {
  localStorage.setItem("buyerCart", JSON.stringify(cart));
  localStorage.setItem("buyerOrders", JSON.stringify(orders));
}

function getBuyerId() {
  const session = window.getSession ? window.getSession() : null;
  if (session && session.buyer_id) return session.buyer_id;
  return localStorage.getItem("buyer_id");
}

async function loadOrdersFromAPI() {
  const buyerId = getBuyerId();
  if (!buyerId) return;

  try {
    const data = await authFetch(`/api/buyers/orders/${buyerId}`);
    if (Array.isArray(data)) {
      orders = data.map((o) => ({
        id: o.order_id,
        date: o.created_at,
        item_count: Number(o.item_count) || 0,
        items: [],
        total: Number(o.total_payment) || 0,
        status: o.status || "pending",
      }));
      saveBuyerData();
    }
  } catch (err) {
    console.warn("Could not load orders from backend:", err);
  }
}

// Listen for localStorage changes (e.g., cart updates from another tab)
window.addEventListener("storage", (event) => {
  if (
    event.key === "buyerCart" ||
    event.key === "cart" ||
    event.key === "shoppingCart" ||
    event.key === "buyerOrders" ||
    event.key === "orders" ||
    event.key === "orderHistory"
  ) {
    loadBuyerData();
    render();
  }
});

function displayUserInfo() {
  const session = window.getSession ? window.getSession() : null;
  if (session) {
    const email = session.email;
    const firstName = email.split("@")[0];
    document.getElementById("buyer-email").textContent = email;
    document.getElementById("profile-email").value = email;
    document.querySelector(".topbar-left h2").textContent =
      `Welcome, ${firstName}!`;
  }

  loadProfile();
}

// tab switching anf hiding rest tabs
function switchTab(tabName, element) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });

  const selectedTab = document.getElementById(`${tabName}-tab`);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }

  // Update active nav item
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  if (element) {
    element.classList.add("active");
  }

  // Update page title
  const titles = {
    dashboard: "Buyer Dashboard",
    browse: "Browse Products",
    cart: "Shopping Cart",
    orders: "My Orders",
    profile: "My Profile",
  };
  const titleEl = document.getElementById("page-title");
  if (titleEl) titleEl.textContent = titles[tabName] || "Dashboard";

  const subtitles = {
    dashboard: "Welcome back to your shopping hub",
    browse: "Find fresh produce from local farmers",
    cart: "Review and manage your items",
    orders: "Track and manage your orders",
    profile: "Manage your account information",
  };
  const subtitleEl = document.getElementById("page-subtitle");
  if (subtitleEl) subtitleEl.textContent = subtitles[tabName] || "";

  // Ensure the latest cart/orders state renders when switching tabs
  render();
}
// Expose globally so other scripts (e.g. filters.js) can call it.
window.switchTab = switchTab;

function makingorders() {
  const orderId = "ORD-" + Date.now();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + 5000 + tax;

  const order = {
    id: orderId,
    date: new Date().toISOString(),
    items: cart.map((item) => ({ ...item, qty: item.qty || 1 })),
    total: total,
    status: "pending",
  };

  orders.unshift(order);
  cart = [];
  saveBuyerData();
  render();
  showToast("Order placed successfully! 🎉");
}

// rendering function
function render() {
  updateStats();
  updateCartBadge();
  renderCart();
  renderOrders();
  renderDashboardOrders();
}

function updateStats() {
  document.getElementById("stat-cart").textContent = cart.length;
  document.getElementById("stat-orders").textContent = orders.length;

  const delivered = orders.filter((o) => o.status === "delivered").length;
  document.getElementById("stat-delivered").textContent = delivered;

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSpentEl = document.getElementById("stat-spent");
  if (totalSpentEl) {
    totalSpentEl.textContent = totalSpent.toLocaleString();
  }
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const summary = document.getElementById("cart-summary");

  if (cart.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <div class="empty-text">Your cart is empty</div>
                <div class="empty-sub">Add some fresh produce to get started</div>
                <button class="empty-cta" onclick="switchTab('browse', null)">🌾 Browse Products</button>
            </div>
        `;
    summary.style.display = "none";
    return;
  }

  container.innerHTML = cart
    .map(
      (item, idx) => `
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
    `,
    )
    .join("");

  // Show summary
  const total = cart.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );
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
            <button class="checkout-btn" onclick="if (typeof window.checkout === 'function') window.checkout(); else console.error('checkout failed to load');"> Proceed to Checkout</button>
        </div>
    `;
  summary.style.display = "block";
}

function renderOrders() {
  const container = document.getElementById("orders-list");
  let filteredOrders = orders;

  if (currentOrderFilter !== "all") {
    filteredOrders = orders.filter((o) => o.status === currentOrderFilter);
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

  container.innerHTML = filteredOrders
    .map((order) => {
      const statusClass = `badge-${order.status}`;
      const count = order.item_count || order.items.length || 0;
      return `
            <div class="item-card">
                <div class="item-image" style="font-size: 1.5rem;">📦</div>
                <div class="item-details">
                    <div class="item-name">Order #${order.id}</div>
                    <div class="item-farmer">${count} item(s)</div>
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
    })
    .join("");
}

function renderDashboardOrders() {
  const container = document.getElementById("dashboard-orders");
  const recentOrders = orders.slice(-3).reverse();

  if (recentOrders.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div class="empty-text">No orders yet</div>
                <div class="empty-sub">Start shopping to place your first order</div>
                <button class="empty-cta" onclick="switchTab('browse', null)">🌾 Browse Products</button>
            </div>
        `;
    return;
  }

  container.innerHTML = recentOrders
    .map((order) => {
      const statusClass = `badge-${order.status}`;
      const count = order.item_count || order.items.length || 0;
      return `
            <div class="item-card">
                <div class="item-image" style="font-size: 1.5rem;">📦</div>
                <div class="item-details">
                    <div class="item-name">Order #${order.id}</div>
                    <div class="item-farmer">${count} item(s)</div>
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
    })
    .join("");
}

//  CART OPERATIONS
// quick add and remove to cart for e-commerce
window.quickAddToCart = function (productId, action) {
  const allProducts = window.allProducts || [];
  const product = allProducts.find((p) => p.id === productId);

  if (!product) {
    showToast("Product not found", "error");
    return;
  }

  const qtyInput = document.getElementById(`qty-${productId}`);
  let quantity = parseInt(qtyInput?.value) || 1;

  if (action === -1) {
    quantity = Math.max(1, quantity - 1);
  } else if (action === 1) {
    quantity = quantity + 1;
  } else if (action === 0) {
    const existingIndex = cart.findIndex((item) => item.id === productId);

    if (existingIndex >= 0) {
      cart[existingIndex].qty = (cart[existingIndex].qty || 1) + quantity;
    } else {
      const cartItem = {
        id: product.id,
        pid: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        unit: product.unit || "kg",
        farmer: product.farmer || "Local Farmer",
        location: `${product.district || "Unknown"}, ${product.province || "Region"}`,
        province: product.province,
        district: product.district,
        harvestTime: product.harvestTime,
        image: product.image,
        qty: quantity,
      };
      cart.push(cartItem);
    }

    saveBuyerData();
    updateCartBadge();
    render();
    showToast(`✓ ${product.name} added to cart!`);

    // Reset quantity input
    if (qtyInput) qtyInput.value = 1;
    return;
  }

  // Update quantity input
  if (qtyInput) {
    qtyInput.value = Math.max(1, quantity);
  }
};

// Validate and fix quantity input
window.validateQuantity = function (productId) {
  const qtyInput = document.getElementById(`qty-${productId}`);
  if (qtyInput) {
    const val = parseInt(qtyInput.value) || 1;
    qtyInput.value = Math.max(1, val);
  }
};

// Update cart badge with item count
function updateCartBadge() {
  const cartCount = document.getElementById("cart-count");
  const sideCartBadge = document.getElementById("cart-badge");
  const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);

  if (cartCount) {
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? "inline-block" : "none";
  }

  if (sideCartBadge) {
    sideCartBadge.textContent = totalItems;
    sideCartBadge.style.display = totalItems > 0 ? "inline-block" : "none";
  }
}

function addToCart(name, farmer, price, location, quantity) {
  const existingItem = cart.find(
    (item) => item.name === name && item.farmer === farmer,
  );

  if (existingItem) {
    existingItem.qty = (existingItem.qty || 1) + 1;
  } else {
    cart.push({ name, farmer, price, location, quantity, qty: 1 });
  }

  saveBuyerData();
  updateCartBadge();
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
    updateCartBadge();
    render();
  }
}

function removeFromCart(idx) {
  const item = cart[idx];
  cart.splice(idx, 1);
  saveBuyerData();
  updateCartBadge();
  render();
  showToast(`${item.name} removed from cart`);
}

window.checkout = function () {
  console.log("checkout() called - buyer.js loaded successfully");
  if (cart.length === 0) {
    showToast("Your cart is empty");
    return;
  }

  // Check if user is logged in
  const session = getSession();
  if (!session) {
    showToast("Please log in to place an order");
    window.location.href = "./login.html";
    return;
  }

  openPaymentModal();
};
window.makingorders = makingorders; // Also expose for potential use

//  Payment and reder processing 
function openPaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (!modal) return;

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );
  const tax = Math.round(subtotal * 0.05);
  const delivery = 5000;
  const total = subtotal + delivery + tax;

  // Update UI
  const totalEl = document.getElementById("modal-total-amount");
  if (totalEl) totalEl.textContent = total.toLocaleString() + " RWF";

  modal.classList.add("active");
}

function closePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.classList.remove("active");

  // Reset form
  const form = document.getElementById("payment-form");
  if (form) form.reset();
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const fullNameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("payment-email");
  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();

  // Validation
  if (!email || !email.includes("@")) {
    showToast("Please enter a valid email address");
    return;
  }

  // Show loading state
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Creating order...";
  btn.disabled = true;

  try {
    // Step 1: Calculate cart total (matches backend)
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * (item.qty || 1),
      0,
    );
    const deliveryFee = 5.0;
    const totalPayment = subtotal + deliveryFee;

    // Step 2: Place order on backend
    const items = cart.map((item) => ({
      product_id: item.pid || item.id || 1, // Fallback if no product_id
      price: item.price,
      quantity: item.qty || 1,
    }));

    const orderResponse = await authFetch("/api/buyers/place-order", {
      method: "POST",
      body: JSON.stringify({
        items,
        pickup_location:
          (JSON.parse(localStorage.getItem("buyerProfile") || "{}") || {})
            .location ||
          cart[0]?.location ||
          "",
        delivery_location:
          (JSON.parse(localStorage.getItem("buyerProfile") || "{}") || {})
            .location ||
          cart[0]?.location ||
          "",
      }),
    });

    const orderId = orderResponse.order_id;

    // Step 3: Initialize Flutterwave payment
    const initResponse = await authFetch("/api/payments/initialize", {
      method: "POST",
      body: JSON.stringify({
        order_id: orderId,
        email: email,
        customer_name:
          (JSON.parse(localStorage.getItem("buyerProfile") || "{}") || {})
            .name || "",
        phone:
          (JSON.parse(localStorage.getItem("buyerProfile") || "{}") || {})
            .phone || "",
      }),
    });

    const { payment_link, tx_ref } = initResponse;

    // Step 4: Redirect to Flutterwave payment
    if (payment_link) {
      // Store the tx_ref in session storage for verification after redirect
      sessionStorage.setItem("pending_payment_ref", tx_ref);
      window.location.href = payment_link;
    } else {
      showToast("Failed to get payment link", "error");
    }
  } catch (err) {
    console.error("Payment error:", err);
    showToast(
      err.message || "Payment initialization failed. Please try again.",
      "error",
    );
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

async function verifyPayment(tx_ref) {
  try {
    const response = await fetch(`${API_BASE}/api/payments/verify/${tx_ref}`);
    const result = await response.json();

    if (result.flutterwave_status === "successful") {
      showToast("Payment successful! Order confirmed. 🎉");
      cart = [];
      saveBuyerData();
      await loadOrdersFromAPI();
      render();

      // Keep user on buyer dashboard orders tab after payment callbacks.
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set("tab", "orders");
      currentUrl.searchParams.delete("tx_ref");
      window.history.replaceState({}, document.title, currentUrl.toString());

      switchTab("orders", null);
      closePaymentModal();
    } else {
      showToast(
        "Payment verification failed. Please contact support.",
        "error",
      );
    }
  } catch (err) {
    showToast("Verification failed. Please check your order status.", "error");
  }
}

// Auto-verify if returning from Flutterwave
// Check for tx_ref in URL or session storage
const pendingRef = sessionStorage.getItem("pending_payment_ref");
if (pendingRef) {
  sessionStorage.removeItem("pending_payment_ref");
  verifyPayment(pendingRef);
} else if (window.location.search.includes("tx_ref=")) {
  const urlParams = new URLSearchParams(window.location.search);
  const txRef = urlParams.get("tx_ref");
  if (txRef) {
    verifyPayment(txRef);
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// completeOrder replaced by Paystack flow in handlePaymentSubmit

// order filtering
function filterOrders(status) {
  currentOrderFilter = status;

  // Update active button
  document.querySelectorAll("#orders-tab .tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (event && event.target) {
    event.target.classList.add("active");
  }

  renderOrders();
}

//  Profile
function saveProfile() {
  const name = document.getElementById("profile-name").value;
  const phone = document.getElementById("profile-phone").value;
  const location = document.getElementById("profile-location").value;

  localStorage.setItem(
    "buyerProfile",
    JSON.stringify({ name, phone, location }),
  );

  if (name) {
    document.querySelector(".topbar-left h2").textContent =
      `Welcome, ${name.split(" ")[0]}!`;
  }

  showToast("Profile updated successfully! ✓");
}

function loadProfile() {
  const profile =
    JSON.parse(localStorage.getItem("buyerProfile") || "{}") || {};
  document.getElementById("profile-name").value = profile.name || "";
  document.getElementById("profile-phone").value = profile.phone || "";
  document.getElementById("profile-location").value = profile.location || "";

  if (profile.name) {
    document.querySelector(".topbar-left h2").textContent =
      `Welcome, ${profile.name.split(" ")[0]}!`;
  }
}

// 
function previewAvatar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    const img = document.getElementById("avatar-preview");
    img.src = ev.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  const msgEl = document.getElementById("toast-msg");

  msgEl.textContent = msg;
  t.className = "show"; // Reset classes

  if (type === "error") {
    t.style.background = "var(--red)";
  } else {
    t.style.background = "var(--green-mid)";
  }

  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

/**
 * Confirm logout and clear session
 */
function confirmLogout() {
  if (confirm("Are you sure you want to log out?")) {
    localStorage.removeItem("userSession");
    localStorage.removeItem("token");
    localStorage.removeItem("cart");
    localStorage.removeItem("rememberedEmail");
    localStorage.removeItem("buyerCart");
    localStorage.removeItem("buyerOrders");
    window.location.href = "./login.html";
  }
}

// Load products from backend
function loadProductsFromAPI() {
  const API_BASE = window.API_BASE_URL || "http://localhost:5000";
  fetch(`${API_BASE}/api/buyers/marketplace`)
    .then((response) => response.json())
    .then((data) => {
      products = data.map((p) => ({
        id: p.product_id,
        name: p.product_name,
        price: p.price_per_unit,
        qty: p.quantity_available,
        unit: p.unit || "kg",
        district: p.district_name,
        farmer: "Farmer", // Could enhance with farmer name
        image: p.image_url,
      }));
      render();
    });
}

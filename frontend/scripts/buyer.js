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

// ============= INITIALIZATION =============
// Load saved cart/orders, fetch latest backend orders, and render UI.
document.addEventListener("DOMContentLoaded", async function () {
  loadBuyerData();
  displayUserInfo();
  loadProductsFromAPI();
  await loadOrdersFromAPI();
  render();
  setupSidebarToggle();
});

/**
 * On page load, check if user was redirected to cart tab
 */
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");

  if (tab === "cart") {
    switchTab("cart");
  }
});

// ============= SIDEBAR TOGGLE (Mobile) =============
function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");

  // Create toggle button if it doesn't exist
  let toggleBtn = document.querySelector(".sidebar-toggle-btn");
  if (!toggleBtn) {
    toggleBtn = document.createElement("button");
    toggleBtn.className = "sidebar-toggle-btn";
    toggleBtn.innerHTML = "☰";
    toggleBtn.setAttribute("aria-label", "Toggle sidebar");
    const header = document.getElementById("header");
    header.appendChild(toggleBtn);
  }

  toggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");
  });

  if (overlay) {
    overlay.addEventListener("click", function () {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    });
  }

  // Close sidebar on window resize if screen is large
  window.addEventListener("resize", function () {
    if (window.innerWidth >= 1024) {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
    }
  });
}

function closeSidebarOnMobile() {
  if (window.innerWidth < 1024) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    sidebar.classList.remove("active");
    overlay.classList.remove("active");
  }
}

// ============= USER DATA MANAGEMENT =============
function loadBuyerData() {
  // Load cart and orders from localStorage (supporting legacy keys)
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
    const name = email.split("@")[0];
    document.getElementById("buyer-email").textContent = email;
    document.getElementById("profile-email").value = email;
    document.querySelector(".topbar-left h2").textContent = `Welcome, ${name}!`;
  }
}

// ============= TAB SWITCHING =============
function switchTab(tabName, element) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.style.display = "none";
  });

  // Show selected tab
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
    cart: "Shopping Cart",
    orders: "My Orders",
    profile: "My Profile",
  };
  document.getElementById("page-title").textContent =
    titles[tabName] || "Dashboard";

  const subtitles = {
    dashboard: "Welcome back to your shopping hub",
    cart: "Review and manage your items",
    orders: "Track and manage your orders",
    profile: "Manage your account information",
  };
  document.getElementById("page-subtitle").textContent =
    subtitles[tabName] || "";

  // Ensure the latest cart/orders state renders when switching tabs
  render();
}

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
  switchTab("orders", null);
  showToast("Order placed successfully! 🎉");
}

// ============= RENDERING =============
function render() {
  updateStats();
  renderCart();
  renderOrders();
  renderDashboardOrders();
}

function updateStats() {
  document.getElementById("stat-cart").textContent = cart.length;
  document.getElementById("stat-orders").textContent = orders.length;

  const delivered = orders.filter((o) => o.status === "delivered").length;
  document.getElementById("stat-delivered").textContent = delivered;

  // Update cart badge
  const badge = document.getElementById("cart-badge");
  if (badge) {
    if (cart.length > 0) {
      badge.textContent = cart.length;
      badge.style.display = "inline-block";
    } else {
      badge.style.display = "none";
    }
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
                <button class="empty-cta" onclick="window.location.href='./home.html'">🌾 Browse Products</button>
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
            <button class="checkout-btn" onclick="checkout()"> Proceed to Checkout</button>
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
                <button class="empty-cta" onclick="window.location.href='./home.html'">🌾 Browse Products</button>
            </div>
        `;
    return;
  }

  container.innerHTML = recentOrders
    .map((order) => {
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
    })
    .join("");
}

// ============= CART OPERATIONS =============
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
    showToast("Your cart is empty");
    return;
  }
  openPaymentModal();
}

// ============= PAYMENT & ORDER PROCESSING =============
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

  // Update modal UI
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
  const phoneInput = document.getElementById("momo-number");
  const fullName = fullNameInput.value.trim();
  const phoneNumber = phoneInput.value.trim();

  // Validation
  if (!fullName || fullName.length < 3) {
    showToast("Please enter a valid full name");
    return;
  }

  if (!phoneNumber || phoneNumber.length < 10) {
    showToast("Please enter a valid phone number");
    return;
  }

  // Show loading state
  const btn = e.target.querySelector('button[type="submit"]');
  const originalText = btn.textContent;
  btn.textContent = "Processing...";
  btn.disabled = true;

  // Simulate payment processing delay
  setTimeout(async () => {
    try {
      await completeOrder(fullName, phoneNumber);
    } catch (err) {
      showToast(err.message || "Order failed. Please try again.", "error");
    } finally {
      // Reset UI
      btn.textContent = originalText;
      btn.disabled = false;
      closePaymentModal();
    }
  }, 2000);
}

async function completeOrder(fullName, phoneNumber) {
  const orderId = "ORD-" + Date.now();
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.qty || 1),
    0,
  );
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + 5000 + tax;

  const items = cart.map((item) => ({
    product_id: item.pid || item.id,
    price: item.price,
    quantity: item.qty || 1,
  }));

  // Attempt to place order on the backend if user is authenticated
  let backendOrder = null;
  try {
    backendOrder = await authFetch("/api/buyers/place-order", {
      method: "POST",
      body: JSON.stringify({
        items,
        total,
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
  } catch (err) {
    showToast(
      err.message ||
        "Could not place order. Please check your connection and try again.",
      "error",
    );
    return;
  }

  if (!backendOrder || !backendOrder.order_id) {
    showToast("Order could not be completed. Please try again.", "error");
    return;
  }

  const order = {
    id: backendOrder.order_id,
    date: new Date().toISOString(),
    items: cart.map((item) => ({ ...item, qty: item.qty || 1 })),
    total: total,
    status: "pending",
    payment: {
      method: "Mobile Money",
      phone: phoneNumber,
      status: "paid",
    },
    customer: {
      name: fullName,
    },
  };

  orders.unshift(order);
  cart = [];
  saveBuyerData();

  // Refresh order history from server, if possible
  await loadOrdersFromAPI();

  render();
  switchTab("orders", null);
  showToast("Payment successful! Order placed. 🎉");
}

// ============= ORDER FILTERING =============
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

// ============= PROFILE OPERATIONS =============
function saveProfile() {
  const name = document.getElementById("profile-name").value;
  const phone = document.getElementById("profile-phone").value;
  const location = document.getElementById("profile-location").value;

  localStorage.setItem(
    "buyerProfile",
    JSON.stringify({ name, phone, location }),
  );
  showToast("Profile updated successfully! ✓");
}

// ============= UTILITIES =============
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

function showToast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

/**
 * Confirm logout and clear session
 */
function confirmLogout() {
  if (confirm('Are you sure you want to log out?')) {
    localStorage.removeItem('userSession');
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    localStorage.removeItem('rememberedEmail');
    window.location.href = './login.html';
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

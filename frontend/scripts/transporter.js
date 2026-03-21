const API_BASE = window.API_BASE_URL || "http://localhost:5000";

function getToken() {
  const token = localStorage.getItem("token");
  if (token) return token;
  try {
    const session = JSON.parse(localStorage.getItem("userSession") || "null");
    return session && session.token ? session.token : null;
  } catch (_e) {
    return null;
  }
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("userSession") || "null");
  } catch (_e) {
    return null;
  }
}

function authFetch(path, options = {}) {
  options.headers = options.headers || {};

  const token = getToken();
  if (!token) {
    window.location.href =
      "./login.html?redirect=" + encodeURIComponent(window.location.pathname);
    return Promise.reject(new Error("Missing auth token"));
  }

  options.headers["Authorization"] = "Bearer " + token;
  if (!options.headers["Content-Type"] && !(options.body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
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
      if (res.status === 401) {
        window.location.href =
          "./login.html?redirect=" +
          encodeURIComponent(window.location.pathname);
      }
      throw new Error(message);
    }
    return body;
  });
}

function showToast(msg, type) {
  const t = document.getElementById("toast");
  const m = document.getElementById("toast-msg");
  if (!t || !m) return;
  m.textContent = msg;
  t.className = "toast" + (type ? " " + type : "");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3200);
}

function ensureTransporter() {
  const session = getSession();
  if (!session || session.role !== "transporter") {
    window.location.href =
      "./login.html?redirect=" + encodeURIComponent(window.location.pathname);
    return false;
  }
  return true;
}

function displayUserInfo() {
  const session = getSession();
  if (!session) return;
  document.getElementById("transporter-email").textContent =
    session.email || "";
  const name = (session.email || "").split("@")[0];
  document.querySelector(".topbar-left h2").textContent = `Welcome, ${name}!`;
}

function switchTab(tabName, element) {
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => tab.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((tab) => (tab.style.display = "none"));

  const tab = document.getElementById(tabName + "-tab");
  if (tab) {
    tab.classList.add("active");
    tab.style.display = "block";
  }

  document
    .querySelectorAll(".nav-item")
    .forEach((item) => item.classList.remove("active"));
  if (element && element.closest) {
    const navItem = element.closest(".nav-item");
    if (navItem) navItem.classList.add("active");
  }

  const titles = {
    dashboard: "Transporter Dashboard",
    available: "Available Deliveries",
    mine: "My Deliveries",
    profile: "My Profile",
  };

  const subtitles = {
    dashboard: "Manage deliveries and earnings",
    available: "Accept nearby deliveries",
    mine: "Track delivery progress",
    profile: "Update your contact info",
  };

  document.getElementById("page-title").textContent =
    titles[tabName] || "Transporter Dashboard";
  document.getElementById("page-subtitle").textContent =
    subtitles[tabName] || "";

  if (tabName === "available") {
    loadAvailable();
  }
  if (tabName === "mine") {
    loadAssigned();
  }
}

function updateStats(deliveries, assigned) {
  document.getElementById("stat-available").textContent = deliveries.length;
  document.getElementById("stat-assigned").textContent = assigned.length;
  const earnings = assigned.reduce(
    (sum, d) => sum + (Number(d.total_payment) || 0),
    0,
  );
  document.getElementById("stat-earnings").textContent =
    earnings.toLocaleString() + " RWF";
}

async function loadAvailable() {
  try {
    const deliveries = await authFetch(
      "/api/transporters/available-deliveries",
    );
    renderAvailable(deliveries || []);
    const assigned = (await authFetch("/api/transporters/my-deliveries")) || [];
    updateStats(deliveries || [], assigned);
  } catch (err) {
    console.error(err);
    showToast("Unable to load available deliveries.", "error");
  }
}

async function loadAssigned() {
  try {
    const assigned = (await authFetch("/api/transporters/my-deliveries")) || [];
    renderAssigned(assigned);
    const available =
      (await authFetch("/api/transporters/available-deliveries")) || [];
    updateStats(available, assigned);
  } catch (err) {
    console.error(err);
    showToast("Unable to load your deliveries.", "error");
  }
}

function renderAvailable(deliveries) {
  const container = document.getElementById("available-list");
  if (!container) return;

  if (!deliveries || deliveries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">No deliveries available</div>
        <div class="empty-sub">Orders will appear when buyers place them.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = deliveries
    .map((d) => {
      const total = Number(d.total_payment || 0).toLocaleString();
      return `
        <div class="item-card">
          <div class="item-image">📦</div>
          <div class="item-details">
            <div class="item-name">Order #${d.order_id}</div>
            <div class="item-farmer">Buyer: ${escapeHTML(d.buyer_name || "—")}</div>
            <div class="item-meta">
              <span>Pickup: ${escapeHTML(d.pickup_location || "—")}</span>
              <span>Dropoff: ${escapeHTML(d.dropoff_location || "—")}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.4rem;">
            <div class="item-price">${total} RWF</div>
            <button class="checkout-btn" onclick="acceptDelivery(${d.delivery_id})">Accept</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAssigned(deliveries) {
  const container = document.getElementById("mine-list");
  if (!container) return;

  if (!deliveries || deliveries.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div class="empty-text">No assigned deliveries.</div>
        <div class="empty-sub">Accept deliveries from the Available tab.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = deliveries
    .map((d) => {
      const total = Number(d.total_payment || 0).toLocaleString();
      return `
        <div class="item-card">
          <div class="item-image">🚚</div>
          <div class="item-details">
            <div class="item-name">Order #${d.order_id}</div>
            <div class="item-farmer">Buyer: ${escapeHTML(d.buyer_name || "—")}</div>
            <div class="item-meta">
              <span>Pickup: ${escapeHTML(d.pickup_location || "—")}</span>
              <span>Dropoff: ${escapeHTML(d.dropoff_location || "—")}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;">
            <div class="item-price">${total} RWF</div>
            <div class="status-badge badge-${d.delivery_status || "pending"}">${(d.delivery_status || "pending").replace(/_/g, " ")}</div>
            ${d.delivery_status === "in_transit" ? `<button class="checkout-btn" onclick="markDelivered(${d.delivery_id})">Mark Delivered</button>` : ""}
          </div>
        </div>
      `;
    })
    .join("");
}

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function acceptDelivery(deliveryId) {
  try {
    await authFetch("/api/transporters/accept-delivery", {
      method: "POST",
      body: JSON.stringify({ delivery_id: deliveryId }),
    });
    showToast("Delivery accepted!", "success");
    await loadAvailable();
    await loadAssigned();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Unable to accept delivery", "error");
  }
}

async function markDelivered(deliveryId) {
  try {
    await authFetch("/api/transporters/update-status", {
      method: "POST",
      body: JSON.stringify({
        delivery_id: deliveryId,
        status: "delivered",
      }),
    });
    showToast("Marked as delivered!", "success");
    await loadAssigned();
  } catch (err) {
    console.error(err);
    showToast(err.message || "Unable to update status", "error");
  }
}

function setupSidebarToggle() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
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

function saveProfile() {
  const name = document.getElementById("profile-name").value.trim();
  const phone = document.getElementById("profile-phone").value.trim();
  const vehicle = document.getElementById("profile-vehicle").value.trim();

  // Persist locally (no backend endpoint yet)
  const profile = { name, phone, vehicle };
  localStorage.setItem("transporterProfile", JSON.stringify(profile));
  showToast("Profile saved!");
}

function loadProfile() {
  const profile =
    JSON.parse(localStorage.getItem("transporterProfile") || "{}") || {};
  document.getElementById("profile-name").value = profile.name || "";
  document.getElementById("profile-phone").value = profile.phone || "";
  document.getElementById("profile-vehicle").value = profile.vehicle || "";
}

function confirmLogout() {
  if (window.confirm("Are you sure you want to log out?")) {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("transporter_id");
    localStorage.removeItem("userSession");
    localStorage.removeItem("session");
    localStorage.removeItem("transporterProfile");
    showToast("Logging out...", "success");
    setTimeout(() => {
      window.location.href = "./pages/login.html";
    }, 800);
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", async function () {
  if (!ensureTransporter()) return;
  displayUserInfo();
  setupSidebarToggle();
  loadAvailable();
  loadAssigned();
  loadProfile();
});

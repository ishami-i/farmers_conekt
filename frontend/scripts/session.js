/**
 * Session Management Script
 * Handles:
 * 1. Checking if user is logged in
 * 2. Protecting routes (farmer.html and transporter.html only)
 * 3. Managing session timeouts
 */

(function () {
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const SESSION_KEY = "userSession";
  const PROTECTED_PAGES = ["farmer.html", "transporter.html"];

  /**
   * Check if user has an active session
   * @returns {Object|null} User session object or null if not logged in
   */
  function getUserSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const currentTime = new Date().getTime();
        const sessionAge = currentTime - (session.loginTime || 0);

        // Check if session has expired
        if (sessionAge > SESSION_TIMEOUT) {
          localStorage.removeItem(SESSION_KEY);
          return null;
        }

        return session;
      }

      // Fallback: legacy session storage key
      const legacy = localStorage.getItem("session");
      if (!legacy) return null;
      const parsed = JSON.parse(legacy);
      return {
        ...parsed,
        loginTime: Date.now(),
        token: localStorage.getItem("token") || null,
      };
    } catch (error) {
      console.error("Error reading session:", error);
      return null;
    }
  }

  /**
   * Check if current page is protected
   */
  function isProtectedPage() {
    const pathname = window.location.pathname;
    const currentPage = pathname.split("/").pop() || "home.html";
    return PROTECTED_PAGES.includes(currentPage);
  }

  // /**
  //  * Redirect to login page
  //  */
  // function redirectToLogin() {
  //   const returnUrl = window.location.pathname + window.location.search;
  //   window.location.href = "./login.html?redirect=" + encodeURIComponent(returnUrl);
  // }

  /**
   * Logout user and clear session
   */
  window.confirmLogout = function () {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("token");
      localStorage.removeItem("cart");
      localStorage.removeItem("rememberedEmail");
      window.location.href = "./home.html";
    }
  };

  /**
   * Check authentication on page load
   * Only protects farmer.html and transporter.html.
   * home.html is PUBLIC; buyer tabs within it are hidden by JS when not logged in.
   */
  function checkAuthentication() {
    if (isProtectedPage()) {
      const session = getUserSession();
      if (!session) {
        redirectToLogin();
        return false;
      }
      return true;
    }
  }

  /**
   * Display current user info
   */
  function displayUserInfo() {
    const session = getUserSession();
    if (!session) return;

    const farmerNameEl = document.querySelector(".farmer-name");
    if (farmerNameEl) {
      farmerNameEl.textContent = session.email.split("@")[0];
    }

    const topbarNameEl = document.querySelector(".topbar-left h2");
    if (topbarNameEl) {
      topbarNameEl.textContent = `Welcome, ${session.email.split("@")[0]}!`;
    }
  }

  /**
   * Update navigation based on login status
   */
  function updateNavigation() {
    const session = getUserSession();
    const loginLink = document.getElementById("login-link");
    const logoutLink = document.getElementById("logout-link");
    const dashboardLink = document.getElementById("dashboard-link");
    const cartLink = document.getElementById("cart-link");

    if (session) {
      // ✅ User is logged in - show Cart & Logout, hide Login
      if (loginLink) loginLink.style.display = "none";
      if (logoutLink) logoutLink.style.display = "block";
      if (dashboardLink) dashboardLink.style.display = "block";
      if (cartLink) cartLink.style.display = "block";
      updateCartBadge();
    } else {
      // ❌ User NOT logged in - show Login, hide Cart & Logout
      if (loginLink) loginLink.style.display = "block";
      if (logoutLink) logoutLink.style.display = "none";
      if (dashboardLink) dashboardLink.style.display = "none";
      if (cartLink) cartLink.style.display = "none";
    }
  }

  /**
   * Update cart badge count
   */
  function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const badge = document.getElementById("cart-count");
    if (badge) {
      badge.textContent = cartCount;
      badge.style.display = cartCount > 0 ? "inline" : "none";
    }
  }

  /**
   * Make functions globally accessible
   */
  window.getSession = function () {
    return getUserSession();
  };

  window.updateCartBadge = updateCartBadge;

  /**
   * Initialize on page load
   */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      checkAuthentication();
      updateNavigation();
      displayUserInfo();
    });
  } else {
    checkAuthentication();
    updateNavigation();
    displayUserInfo();
  }

  // Listen for storage changes (cart updates from other tabs)
  window.addEventListener("storage", () => {
    updateNavigation();
  });
})();

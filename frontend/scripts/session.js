/**
 * Session Management Script
 * Handles:
 * 1. Checking if user is logged in
 * 2. Protecting routes (farmer.html, buyer.html)
 * 3. Managing session timeouts
 */

(function () {
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const SESSION_KEY = "userSession";
  const PROTECTED_PAGES = ["farmer.html", "buyer.html", "transporter.html"];

  /**
   * Check if user has an active session
   * @returns {Object|null} User session object or null if not logged in
   */
  function getUserSession() {
    try {
      // Primary: use the structured session object used by login.js
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const currentTime = new Date().getTime();
        const sessionAge = currentTime - (session.loginTime || 0);

        // Check if session has expired
        if (sessionAge > SESSION_TIMEOUT) {
          logout();
          return null;
        }

        return session;
      }

      // Fallback: legacy session storage key used by older scripts
      const legacy = localStorage.getItem("session");
      if (!legacy) return null;
      const parsed = JSON.parse(legacy);
      // Create a minimal session object with a login timestamp
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
   * @returns {boolean} True if current page requires authentication
   */
  function isProtectedPage() {
    const pathname = window.location.pathname;
    const currentPage = pathname.split("/").pop() || "home.html";
    return PROTECTED_PAGES.includes(currentPage);
  }

  /**
   * Redirect to login page
   */
  function redirectToLogin() {
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href =
      "./login.html?redirect=" + encodeURIComponent(returnUrl);
  }

  /**
   * Logout user and clear session
   */
  function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem("rememberedEmail");
    window.location.href = "./login.html";
  }

  /**
   * Check authentication on page load
   * Redirects to login if accessing protected page without session
   */
  function checkAuthentication() {
    if (isProtectedPage()) {
      const session = getUserSession();
      if (!session) {
        redirectToLogin();
        return false;
      }
      // Session exists and is valid
      return true;
    }
  }

  /**
   * Display current user info in protected pages
   */
  function displayUserInfo() {
    const session = getUserSession();
    if (!session) return;

    // Update farmer profile name if element exists
    const farmerNameEl = document.querySelector(".farmer-name");
    if (farmerNameEl) {
      farmerNameEl.textContent = session.email.split("@")[0];
    }

    // Update topbar user info if element exists
    const topbarNameEl = document.querySelector(".topbar-left h2");
    if (topbarNameEl) {
      const greeting = `Welcome, ${session.email.split("@")[0]}!`;
      topbarNameEl.textContent = greeting;
    }
  }

  /**
   * Display navigation links based on session
   */
  function updateNavigation() {
    const session = getUserSession();
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const dashboardLink = document.getElementById('dashboard-link');
    const cartLink = document.getElementById('cart-link');

    if (session) {
      // User is logged in
      if (loginLink) loginLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'block';
      if (dashboardLink) dashboardLink.style.display = 'block';
      if (cartLink) cartLink.style.display = 'block';
    } else {
      // User is not logged in
      if (loginLink) loginLink.style.display = 'block';
      if (logoutLink) logoutLink.style.display = 'none';
      if (dashboardLink) dashboardLink.style.display = 'none';
      if (cartLink) cartLink.style.display = 'none';
    }
  }

  /**
   * Set up session monitoring and auto-logout
   */
  function monitorSession() {
    if (!isProtectedPage()) return;

    // Check session every 5 minutes
    setInterval(
      () => {
        const session = getUserSession();
        if (!session) {
          alert("Your session has expired. Please log in again.");
          redirectToLogin();
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Make logout function globally accessible
   */
  window.logoutUser = function () {
    logout();
  };

  /**
   * Make session check globally accessible
   */
  window.getSession = function () {
    return getUserSession();
  };

  /**
   * Initialize on page load
   */
  document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
    updateNavigation();
    displayUserInfo();
    monitorSession();
  });

  // Also check immediately (in case DOMContentLoaded already fired)
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
})();

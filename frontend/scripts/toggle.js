/**
 * Toggle Script
 * Handles:
 * 1. Mobile navigation (hamburger menu)
 * 2. Light/Dark mode toggle
 */

(function () {
  // ===== HAMBURGER MENU TOGGLE =====
  const toggleButton = document.getElementById('toggle-button');
  const navMenu = document.getElementById('nav');
  const navLinks = document.querySelectorAll('.nav-links a');

  // Toggle mobile navigation
  if (toggleButton && navMenu) {
    toggleButton.addEventListener('click', () => {
      const isActive = toggleButton.classList.toggle('active');
      navMenu.classList.toggle('active');

      // Accessibility: update aria-expanded
      toggleButton.setAttribute('aria-expanded', isActive);
    });
  }

  // Close menu when a navigation link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (!toggleButton || !navMenu) return;

      toggleButton.classList.remove('active');
      navMenu.classList.remove('active');
      toggleButton.setAttribute('aria-expanded', 'false');
    });
  });

})();

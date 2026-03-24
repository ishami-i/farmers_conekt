/**
 * Toggle Script
 * Handles:
 * 1. Hamburger menu toggle for mobile navigation
 * 2. Light/Dark mode toggle
 */

(function() {
  // ============= HAMBURGER MENU TOGGLE =============
  const toggleButton = document.getElementById('toggle-button');
  const navMenu = document.getElementById('nav');

  // Toggle mobile navigation menu
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      toggleButton.classList.toggle('active');
      navMenu.classList.toggle('active');
      
      // Update aria attributes for accessibility
      const isExpanded = toggleButton.classList.contains('active');
      toggleButton.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Close menu when a nav link is clicked
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      if (toggleButton) {
        toggleButton.classList.remove('active');
      }
      if (navMenu) {
        navMenu.classList.remove('active');
      }
      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', false);
      }
    });
  });
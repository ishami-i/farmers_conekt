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

  // ============= LIGHT/DARK MODE TOGGLE =============
  const lightDarkToggle = document.getElementById('light-dark-toggle');
  const htmlElement = document.documentElement;
  
  // Get saved theme preference from localStorage
  const savedTheme = localStorage.getItem('theme');
  
  // Apply saved theme or detect system preference
  if (savedTheme) {
    applyTheme(savedTheme);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Toggle theme when button is clicked
  if (lightDarkToggle) {
    lightDarkToggle.addEventListener('click', function() {
      const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  // Apply theme to the page
  function applyTheme(theme) {
    htmlElement.setAttribute('data-theme', theme);
    
    if (lightDarkToggle) {
      lightDarkToggle.classList.toggle('dark-mode', theme === 'dark');
      lightDarkToggle.setAttribute('aria-pressed', theme === 'dark');
    }

    // Apply theme-specific styles
    if (theme === 'dark') {
      document.body.style.background = '#2d2d2d';
      document.body.style.color = '#e0e0e0';
    } else {
      document.body.style.background = '';
      document.body.style.color = '';
    }
  }

  // Listen for system theme changes
  const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeQuery.addEventListener('change', (e) => {
    // Only apply system preference if user hasn't set a preference
    if (!localStorage.getItem('theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function(e) {
    if (toggleButton && navMenu && !toggleButton.contains(e.target) && !navMenu.contains(e.target)) {
      toggleButton.classList.remove('active');
      navMenu.classList.remove('active');
      toggleButton.setAttribute('aria-expanded', false);
    }
  });
})();

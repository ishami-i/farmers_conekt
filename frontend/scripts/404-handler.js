/**
 * 404 Page Handler
 * Checks if a page exists, if not, redirects to 404.html
 */

(function() {
  // List of valid pages in the application
  const validPages = [
    'home.html',
    'farmer.html',
    'buyer.html',
    'login.html',
    '404.html'
  ];

  // Get the current page name from the URL
  function getCurrentPageName() {
    const pathname = window.location.pathname;
    const segments = pathname.split('/');
    return segments[segments.length - 1] || 'home.html';
  }

  // Check if page is valid
  function isValidPage(pageName) {
    // If it's the root or empty, it's the home page
    if (!pageName || pageName === '' || pageName === '/') {
      return true;
    }
    
    // Check if the page exists in our valid pages list
    return validPages.includes(pageName);
  }

  // Handle navigation to non-existent pages
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('javascript:')) {
      return; // Skip external links, anchors, and javascript links
    }

    // Extract just the filename
    const pageName = href.split('/').pop();
    
    if (!isValidPage(pageName)) {
      e.preventDefault();
      window.location.href = '../404.html';
    }
  });

  // Check current page on load
  window.addEventListener('load', function() {
    const currentPage = getCurrentPageName();
    
    // Don't redirect if we're already on 404.html
    if (currentPage === '404.html') {
      return;
    }

    if (!isValidPage(currentPage)) {
      window.location.href = '../404.html';
    }
  });

  // Handle back button to invalid pages
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      const currentPage = getCurrentPageName();
      if (currentPage !== '404.html' && !isValidPage(currentPage)) {
        window.location.href = '../404.html';
      }
    }
  });
})();
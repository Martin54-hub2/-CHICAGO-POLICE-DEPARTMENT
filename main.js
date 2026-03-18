// main.js - Main Application Logic
console.log('[APP] Loading main application module...');

// Page navigation
function showPage(page) {
  console.log('[APP] Showing page:', page);
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Show selected page
  const pageEl = document.getElementById(page + '-page');
  if (pageEl) {
    pageEl.classList.add('active');
  }
  
  // Update URL hash
  window.location.hash = page;
  
  // Close mobile menu if open
  closeMobileMenu();
}

// Modal functions
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Mobile menu
function toggleMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

function closeMobileMenu() {
  const menu = document.getElementById('mobileMenu');
  if (menu) {
    menu.classList.remove('active');
  }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('userDropdown')?.classList.remove('active');
  }
});

// Initialize app
window.addEventListener('load', function() {
  console.log('[APP] Initializing CPD Website...');
  console.log('%c🚔 CHICAGO POLICE DEPARTMENT WEBSITE 🚔', 'background: #1e3a8a; color: #fff; font-size: 20px; padding: 10px; font-weight: bold;');
  
  // Initialize database
  DB.init();
  
  // Restore session if exists
  const sessionRestored = restoreSession();
  
  // Handle URL hash
  const hash = window.location.hash.slice(1);
  if (hash) {
    showPage(hash);
    if (hash === 'dashboard' && sessionRestored) {
      loadDashboard();
    }
  } else {
    showPage('home');
  }
  
  console.log('[APP] Application initialized');
});

console.log('[APP] Main application module loaded');

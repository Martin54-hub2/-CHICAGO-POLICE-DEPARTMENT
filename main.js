/* =============================================
   main.js — Shared UI Behaviors
   Nav toggle, user menu, active page, loading screen
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* --- Loading Screen (home page only) --- */
  const loadingScreen = document.querySelector('.loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('fade-out');
      setTimeout(() => loadingScreen.remove(), 500);
    }, 1200);
  }

  /* --- Mobile Nav Toggle --- */
  const navToggle = document.querySelector('.nav-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      mainNav.classList.toggle('open');
      const open = mainNav.classList.contains('open');
      navToggle.setAttribute('aria-expanded', open);
      navToggle.innerHTML = open ? '&#10005;' : '&#9776;';
    });
    mainNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.innerHTML = '&#9776;';
      });
    });
  }

  /* --- Set Active Nav Link --- */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(link => {
    const href = link.getAttribute('href');
    const linkFile = href.split('/').pop();
    if (linkFile === currentFile) {
      link.classList.add('active');
    }
  });

  /* --- Build User Menu or Auth Buttons --- */
  buildHeaderAuth();

  /* --- User Menu Toggle --- */
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.user-menu-trigger');
    const dropdown = document.querySelector('.user-dropdown');
    if (trigger && dropdown) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    } else if (dropdown && !e.target.closest('.user-dropdown')) {
      dropdown.classList.remove('open');
    }
  });

  /* --- Alert bar rotation --- */
  const alerts = document.querySelectorAll('.alert-text');
  if (alerts.length > 1) {
    let current = 0;
    alerts.forEach((a, i) => { if (i > 0) a.style.display = 'none'; });
    setInterval(() => {
      alerts[current].style.display = 'none';
      current = (current + 1) % alerts.length;
      alerts[current].style.display = 'inline';
    }, 5000);
  }
});

/* --- Build header auth area based on login state --- */
function buildHeaderAuth() {
  const container = document.querySelector('.header-actions');
  if (!container) return;

  const user = CPD.getCurrentUser();
  // Determine if we're in a subfolder
  const path = window.location.pathname;
  const inSub = path.includes('/pages/') || path.includes('/admin/');
  const prefix = inSub ? '../' : '';
  const pagesPrefix = inSub ? '' : 'pages/';

  if (user) {
    // Refresh from storage
    const fresh = CPD.getOfficerById(user.id);
    if (fresh) CPD.setCurrentUser(fresh);
    const u = fresh || user;
    const initials = (u.firstName[0] || '') + (u.lastName[0] || '');
    const photoHTML = u.photo
      ? `<img src="${u.photo}" alt="${u.firstName} ${u.lastName}">`
      : initials;

    container.innerHTML = `
      <div class="user-menu">
        <button class="user-menu-trigger">
          <div class="user-avatar">${photoHTML}</div>
          <span class="user-name">${u.firstName} ${u.lastName}</span>
        </button>
        <div class="user-dropdown">
          <div class="dropdown-header">
            <div class="dd-name">${u.firstName} ${u.lastName}</div>
            <div class="dd-rank">${u.rank} — Badge #${u.badge}</div>
          </div>
          <a href="${inSub ? '' : 'pages/'}profile.html">My Profile</a>
          ${u.role === 'admin' ? `<a href="${inSub ? '../admin/' : 'admin/'}dashboard.html">Admin Dashboard</a>` : ''}
          <button class="dd-logout" onclick="Auth.logout()">Logout</button>
        </div>
      </div>`;
  } else {
    container.innerHTML = `
      <a href="${pagesPrefix}login.html" class="btn btn-outline-blue btn-sm">Portal Login</a>
      <a href="${pagesPrefix}apply.html" class="btn btn-blue btn-sm">Join CPD</a>`;
  }
}

/* --- Utility: format date --- */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

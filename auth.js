/* =============================================
   auth.js — Authentication System
   Login, logout, session checks, redirects
   ============================================= */

const Auth = {

  /* --- Login: validate credentials --- */
  login(username, password) {
    const officer = CPD.getOfficerByUsername(username);
    if (!officer) return { success: false, message: 'Account not found.' };
    if (officer.password !== password) return { success: false, message: 'Incorrect password.' };
    CPD.setCurrentUser(officer);
    return { success: true, user: officer };
  },

  /* --- Logout --- */
  logout() {
    CPD.logout();
    // Determine correct path to home
    const path = window.location.pathname;
    if (path.includes('/pages/') || path.includes('/admin/')) {
      window.location.href = '../index.html';
    } else {
      window.location.href = 'index.html';
    }
  },

  /* --- Require login: redirect if not authenticated --- */
  requireLogin() {
    if (!CPD.isLoggedIn()) {
      const path = window.location.pathname;
      if (path.includes('/admin/')) {
        window.location.href = '../pages/login.html';
      } else if (path.includes('/pages/')) {
        window.location.href = 'login.html';
      } else {
        window.location.href = 'pages/login.html';
      }
      return false;
    }
    return true;
  },

  /* --- Require admin role --- */
  requireAdmin() {
    if (!this.requireLogin()) return false;
    const user = CPD.getCurrentUser();
    if (user.role !== 'admin') {
      alert('Access denied. Admin privileges required.');
      window.location.href = '../index.html';
      return false;
    }
    return true;
  },

  /* --- Refresh current user data from storage --- */
  refreshCurrentUser() {
    const current = CPD.getCurrentUser();
    if (!current) return null;
    const fresh = CPD.getOfficerById(current.id);
    if (fresh) {
      CPD.setCurrentUser(fresh);
      return fresh;
    }
    return current;
  },
};

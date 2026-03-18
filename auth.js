// auth.js - Authentication Module
console.log('[AUTH] Loading authentication module...');

let currentUser = null;

function handleLogin(e) {
  e.preventDefault();
  
  const username = document.getElementById('usernameInput').value;
  const password = document.getElementById('passwordInput').value;
  
  console.log('[AUTH] Login attempt:', username);
  
  const officers = DB.getOfficers();
  
  if (officers[username] && officers[username].password === password) {
    currentUser = { username, ...officers[username] };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    console.log('[AUTH] Login successful');
    updateHeaderForUser();
    showPage('dashboard');
    loadDashboard();
  } else {
    console.log('[AUTH] Login failed');
    alert('Invalid username or password');
  }
  
  return false;
}

function logout() {
  console.log('[AUTH] Logging out');
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateHeaderForUser();
  showPage('home');
}

function restoreSession() {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    console.log('[AUTH] Session restored:', currentUser.username);
    updateHeaderForUser();
    return true;
  }
  return false;
}

function updateHeaderForUser() {
  const h = document.getElementById('headerActions');
  
  if (currentUser) {
    const roleMenu = currentUser.role === 'Admin' 
      ? '<div class="dropdown-item" onclick="showPage(\'admin\')">Admin Panel</div>'
      : currentUser.role === 'Supervisor'
      ? '<div class="dropdown-item" onclick="showPage(\'supervisor\')">Supervisor Panel</div>'
      : '';
    
    let badgeContent = currentUser.callsign?.substring(0, 3) || '--';
    let badgeStyle = '';
    
    const officer = DB.getOfficer(currentUser.username);
    if (officer && officer.photo) {
      badgeStyle = `background-image:url(${officer.photo});background-size:cover;background-position:center;`;
      badgeContent = '';
    }
    
    h.innerHTML = `
      <button class="btn btn-outline">Transform</button>
      <a href="https://discord.gg/7vQEJnaD" target="_blank" class="btn btn-primary">Join CPD</a>
      <div class="user-menu">
        <div class="user-btn" onclick="toggleUserMenu()">
          <div class="user-badge" style="${badgeStyle}">${badgeContent}</div>
          <div class="user-info">
            <div class="user-name">${currentUser.name}</div>
            <div class="user-rank">${currentUser.rank}</div>
          </div>
        </div>
        <div class="user-dropdown" id="userDropdown">
          <div class="dropdown-item" onclick="showPage('dashboard')">Dashboard</div>
          ${roleMenu}
          <div class="dropdown-item" onclick="window.location.href='mdt.html'">MDT System</div>
          <div class="dropdown-item" onclick="logout()">Logout</div>
        </div>
      </div>
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
    `;
  } else {
    h.innerHTML = `
      <button class="btn btn-outline">Transform</button>
      <a href="https://discord.gg/7vQEJnaD" target="_blank" class="btn btn-primary">Join CPD</a>
      <button class="btn btn-login" onclick="showPage('login')" id="loginBtn">Portal Login</button>
      <button class="mobile-menu-btn" onclick="toggleMobileMenu()">☰</button>
    `;
  }
}

function toggleUserMenu() {
  document.getElementById('userDropdown')?.classList.toggle('active');
}

console.log('[AUTH] Authentication module loaded');

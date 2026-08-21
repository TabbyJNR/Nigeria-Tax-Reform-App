const API_URL = `${location.origin}/api`;

// Standard navbar HTML — injected into every page dynamically
function getNavbarHTML(activePage) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isLoggedIn = token && user;
  const isAdmin = isLoggedIn && user.role === 'admin';
  const homeLink = isLoggedIn ? (isAdmin ? 'admin.html' : 'taxpayer-dashboard.html') : 'index.html';

  const links = [
    { href: homeLink, label: 'Home', key: 'home' },
    { href: 'bill-sections.html', label: 'Bill Sections', key: 'bill-sections' },
    { href: 'calculator.html', label: 'Tax Calculator', key: 'calculator' },
    { href: 'payment.html', label: 'Pay Tax', key: 'payment' },
    { href: 'track-payment.html', label: 'Track Payment', key: 'track-payment' },
    { href: 'feedback.html', label: 'Feedback', key: 'feedback' },
  ];

  const navLinks = links.map(l => `
    <a href="${l.href}" class="nav-link ${activePage === l.key ? 'active' : ''}">${l.label}</a>
  `).join('');

  const adminLink = isAdmin ? `<a href="admin.html" class="nav-link ${activePage === 'admin' ? 'active' : ''}">Admin</a>` : '';

  const authSection = isLoggedIn ? `
    <span style="color:rgba(255,255,255,0.88); font-size:0.88rem; font-weight:500;">👤 ${user.fullname.split(' ')[0]}</span>
    <button onclick="handleLogout()" class="btn btn-outline" style="font-size:0.82rem; padding:0.4rem 1rem;">Logout</button>
  ` : `
    <a href="login.html" class="btn btn-outline">Login</a>
    <a href="register.html" class="btn btn-primary">Register</a>
  `;

  return `
    <div class="nav-container">
      <a href="${homeLink}" class="nav-brand"><span>🇳🇬</span><span>NRS Tax Tracking System</span></a>
      <button class="mobile-menu-toggle" onclick="toggleMobileMenu()">☰</button>
      <div class="nav-links" id="navLinks">
        ${navLinks}
        ${adminLink}
      </div>
      <div class="nav-auth" id="navAuth">${authSection}</div>
    </div>
  `;
}

// Inject navbar into page
function renderNavbar(activePage) {
  const navbar = document.querySelector('.navbar');
  if (navbar) navbar.innerHTML = getNavbarHTML(activePage);
}

document.addEventListener('DOMContentLoaded', () => {
  // Detect which page we're on from body data attribute or URL
  const page = document.body.dataset.page || '';
  renderNavbar(page);

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('.btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'taxpayer-dashboard.html';
      }, 900);
    } else {
      showAlert(data.message || 'Login failed.', 'danger');
      if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
    }
  } catch {
    showAlert('Network error. Please try again.', 'danger');
    if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  if (password !== confirmPassword) { showAlert('Passwords do not match.', 'danger'); return; }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'taxpayer-dashboard.html'; }, 900);
    } else {
      showAlert(data.message || 'Registration failed.', 'danger');
    }
  } catch {
    showAlert('Network error. Please try again.', 'danger');
  }
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

function showAlert(message, type, containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const icons = { success: '✅', danger: '❌', warning: '⚠️' };
  container.innerHTML = `<div class="alert alert-${type}">${icons[type] || ''} ${message}</div>`;
  setTimeout(() => { if (container) container.innerHTML = ''; }, 5000);
}

function isAuthenticated() { return !!localStorage.getItem('token'); }
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
function toggleMobileMenu() {
  document.getElementById('navLinks')?.classList.toggle('active');
}
// Legacy support
function updateNavbar() { renderNavbar(document.body.dataset.page || ''); }
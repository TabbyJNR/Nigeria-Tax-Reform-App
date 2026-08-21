const API_URL = `${location.origin}/api`;

document.addEventListener('DOMContentLoaded', () => {
  updateNavbar();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const registerForm = document.getElementById('registerForm');
  if (registerForm) registerForm.addEventListener('submit', handleRegister);
});

function updateNavbar() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navAuth = document.getElementById('navAuth');
  const adminLink = document.getElementById('adminLink');

  if (token && user) {
    if (navAuth) {
      navAuth.innerHTML = `
        <span style="color:rgba(255,255,255,0.88); font-size:0.88rem; font-weight:500;">👤 ${user.fullname.split(' ')[0]}</span>
        <button onclick="handleLogout()" class="btn btn-outline" style="font-size:0.82rem; padding:0.4rem 1rem;">Logout</button>
      `;
    }
    if (adminLink && user.role === 'admin') {
      adminLink.style.display = 'inline-block';
    }
  } else {
    if (navAuth) {
      navAuth.innerHTML = `
        <a href="login.html" class="btn btn-outline">Login</a>
        <a href="register.html" class="btn btn-primary">Register</a>
      `;
    }
    if (adminLink) adminLink.style.display = 'none';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const btn = e.target.querySelector('button[type="submit"]') || e.target.querySelector('.btn-calculate');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'taxpayer-dashboard.html';
        }
      }, 900);
    } else {
      showAlert(data.message || 'Login failed.', 'danger');
      if (btn) { btn.disabled = false; btn.textContent = 'Login'; }
    }
  } catch (error) {
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
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullname, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'taxpayer-dashboard.html'; }, 900);
    } else {
      showAlert(data.message || 'Registration failed.', 'danger');
    }
  } catch (error) {
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
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.toggle('active');
}
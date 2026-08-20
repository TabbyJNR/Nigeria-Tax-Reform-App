// Authentication JavaScript
const API_URL = `${location.origin}/api`;

document.addEventListener('DOMContentLoaded', () => {
  // Update navbar on every page load
  updateNavbar();

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Register form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

// Update navbar based on login state
function updateNavbar() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const navAuth = document.getElementById('navAuth');
  const adminLink = document.getElementById('adminLink');

  if (token && user) {
    // User is logged in — replace Login/Register with name + logout
    if (navAuth) {
      navAuth.innerHTML = `
        <span style="color: white; margin-right: 1rem; font-weight: 500;">👤 ${user.fullname}</span>
        <button onclick="handleLogout()" class="btn btn-outline" style="cursor:pointer;">Logout</button>
      `;
    }
    // Show Admin link if user is admin
    if (adminLink && user.role === 'admin') {
      adminLink.style.display = 'inline-block';
    }
  } else {
    // Not logged in — show Login/Register
    if (navAuth) {
      navAuth.innerHTML = `
        <a href="login.html" class="btn btn-outline">Login</a>
        <a href="register.html" class="btn btn-primary">Register</a>
      `;
    }
    if (adminLink) {
      adminLink.style.display = 'none';
    }
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

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
        // Redirect admin to admin page, regular users to home
        if (data.user.role === 'admin') {
          window.location.href = 'admin.html';
        } else {
          window.location.href = 'index.html';
        }
      }, 1000);
    } else {
      showAlert(data.message || 'Login failed.', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

// Handle register
async function handleRegister(e) {
  e.preventDefault();

  const fullname = document.getElementById('fullname').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    showAlert('Passwords do not match.', 'danger');
    return;
  }

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
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    } else {
      showAlert(data.message || 'Registration failed.', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Utility functions
function showAlert(message, type, containerId = 'alertContainer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type}" style="margin-bottom: 1rem; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'danger'}-color); background-color: ${type === 'success' ? '#d4edda' : type === 'warning' ? '#fff3cd' : '#f8d7da'}; color: ${type === 'success' ? '#155724' : type === 'warning' ? '#856404' : '#721c24'};">
      ${message}
    </div>
  `;

  // Auto-hide after 5 seconds
  setTimeout(() => {
    container.innerHTML = '';
  }, 5000);
}

function isAuthenticated() {
  return !!localStorage.getItem('token');
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function toggleMobileMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}
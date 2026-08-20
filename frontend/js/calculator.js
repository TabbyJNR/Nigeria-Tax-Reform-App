// Tax Calculator JavaScript

const API_URL = `${location.origin}/api`;

document.addEventListener('DOMContentLoaded', () => {
  const calculatorForm = document.getElementById('calculatorForm');
  if (calculatorForm) {
    calculatorForm.addEventListener('submit', handleCalculation);
  }

  // Load history if authenticated
  if (isAuthenticated()) {
    loadCalculationHistory();
  }
});

// Handle calculation
async function handleCalculation(e) {
  e.preventDefault();

  if (!isAuthenticated()) {
    showAlert('Please login to use the tax calculator.', 'danger');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
    return;
  }

  const taxType = document.getElementById('taxType').value;
  const income = document.getElementById('income').value;

  try {
    const response = await fetch(`${API_URL}/calculator`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ taxType, income })
    });

    const data = await response.json();

    if (response.ok) {
      displayResult(data);
      loadCalculationHistory();
    } else {
      showAlert(data.message || 'Calculation failed.', 'danger');
    }
  } catch (error) {
    showAlert('Network error. Please try again.', 'danger');
  }
}

// Display calculation result
function displayResult(data) {
  const container = document.getElementById('resultContainer');

  let detailsHtml = '';

  if (data.taxType === 'PIT') {
    detailsHtml = `
      <div class="result-item">
        <span>Gross Income:</span>
        <span>${formatCurrency(data.income)}</span>
      </div>
      <div class="result-item">
        <span>Consolidated Relief Allowance:</span>
        <span>${formatCurrency(data.cra)}</span>
      </div>
      <div class="result-item">
        <span>Taxable Income:</span>
        <span>${formatCurrency(data.taxableIncome)}</span>
      </div>
    `;
  } else if (data.taxType === 'CIT') {
    detailsHtml = `
      <div class="result-item">
        <span>Company Turnover:</span>
        <span>${formatCurrency(data.income)}</span>
      </div>
      <div class="result-item">
        <span>Tax Rate Applied:</span>
        <span>${(data.rate * 100).toFixed(0)}%</span>
      </div>
    `;
  } else if (data.taxType === 'VAT') {
    detailsHtml = `
      <div class="result-item">
        <span>Original Amount:</span>
        <span>${formatCurrency(data.income)}</span>
      </div>
      <div class="result-item">
        <span>VAT Rate:</span>
        <span>7.5%</span>
      </div>
      <div class="result-item">
        <span>Total with VAT:</span>
        <span>${formatCurrency(data.total)}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="result-card">
      <h3>Calculation Result</h3>
      ${detailsHtml}
      <div class="result-item highlight">
        <span>Tax Amount:</span>
        <span>${formatCurrency(data.taxAmount)}</span>
      </div>
      <div class="result-item highlight">
        <span>Net Amount:</span>
        <span>${formatCurrency(data.netIncome)}</span>
      </div>
  `;
}

// Load calculation history
async function loadCalculationHistory() {
  const container = document.getElementById('historyContainer');

  try {
    const response = await fetch(`${API_URL}/calculator/history`, {
      headers: getAuthHeaders()
    });

    const history = await response.json();

    if (history.length === 0) {
      container.innerHTML = '<p style="color: var(--text-light); text-align: center;">No calculations yet.</p>';
      return;
    }

    container.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Income</th>
            <th>Tax</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          ${history.map(calc => `
            <tr>
              <td>${new Date(calc.created_at).toLocaleDateString()}</td>
              <td>${calc.tax_type}</td>
              <td>${formatCurrency(calc.income)}</td>
              <td>${formatCurrency(calc.tax_amount)}</td>
              <td>${formatCurrency(calc.net_income)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    container.innerHTML = '<p style="color: var(--text-light); text-align: center;">Failed to load history.</p>';
  }
}

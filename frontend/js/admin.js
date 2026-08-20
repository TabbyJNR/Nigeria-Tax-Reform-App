// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
});

// Check admin access
function checkAdminAccess() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  if (!token || user.role !== 'admin') {
    document.getElementById('accessDenied').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    return;
  }

  document.getElementById('accessDenied').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  loadAdminData();
}

// Load all admin data
async function loadAdminData() {
  await Promise.all([
    loadBillSections(),
    loadFeedback(),
    loadStatistics()
  ]);
}

// Load bill sections for admin
async function loadBillSections() {
  try {
    const response = await fetch(`${API_URL}/bills`, {
      headers: getAuthHeaders()
    });
    const bills = await response.json();
    renderBillsTable(bills);
  } catch (error) {
    document.getElementById('billsTableContainer').innerHTML = `
      <div class="alert alert-danger">Failed to load bill sections.</div>
    `;
  }
}

// Render bills table
function renderBillsTable(bills) {
  const container = document.getElementById('billsTableContainer');

  if (bills.length === 0) {
    container.innerHTML = '<p>No bill sections found.</p>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Title</th>
            <th>Category</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${bills.map(bill => `
            <tr>
              <td>${bill.section_number}</td>
              <td>${bill.title}</td>
              <td><span class="bill-category">${bill.category}</span></td>
              <td>
                <button class="btn-small btn-edit" onclick="editBill(${bill.id})">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteBill(${bill.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Load feedback for admin
async function loadFeedback() {
  try {
    const response = await fetch(`${API_URL}/feedback`, {
      headers: getAuthHeaders()
    });
    const feedbacks = await response.json();
    renderFeedbackTable(feedbacks);
  } catch (error) {
    document.getElementById('feedbackTableContainer').innerHTML = `
      <div class="alert alert-danger">Failed to load feedback.</div>
    `;
  }
}

// Render feedback table
function renderFeedbackTable(feedbacks) {
  const container = document.getElementById('feedbackTableContainer');

  if (feedbacks.length === 0) {
    container.innerHTML = '<p>No feedback found.</p>';
    return;
  }

  container.innerHTML = `
    <div style="overflow-x: auto;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Subject</th>
            <th>Message</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${feedbacks.map(fb => `
            <tr>
              <td>${new Date(fb.created_at).toLocaleDateString()}</td>
              <td>${fb.fullname || fb.user_name || 'Anonymous'}</td>
              <td>${fb.subject}</td>
              <td>${fb.message.substring(0, 100)}${fb.message.length > 100 ? '...' : ''}</td>
              <td>
                <button class="btn-small btn-danger" onclick="deleteFeedback(${fb.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Load statistics
async function loadStatistics() {
  try {
    const [billsRes, feedbackRes] = await Promise.all([
      fetch(`${API_URL}/bills`, { headers: getAuthHeaders() }),
      fetch(`${API_URL}/feedback`, { headers: getAuthHeaders() })
    ]);

    const bills = await billsRes.json();
    const feedbacks = await feedbackRes.json();

    document.getElementById('statBills').textContent = bills.length;
    document.getElementById('statFeedback').textContent = feedbacks.length;
    document.getElementById('statUsers').textContent = '—';
    document.getElementById('statCalculations').textContent = '—';
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
}

// Open bill modal
function openBillModal() {
  document.getElementById('billModal').style.display = 'flex';
  document.getElementById('modalTitle').textContent = 'Add Bill Section';
  document.getElementById('billForm').reset();
  document.getElementById('billId').value = '';
}

// Close bill modal
function closeBillModal() {
  document.getElementById('billModal').style.display = 'none';
}

// Edit bill
async function editBill(id) {
  try {
    const response = await fetch(`${API_URL}/bills/${id}`, {
      headers: getAuthHeaders()
    });
    const bill = await response.json();

    document.getElementById('billId').value = bill.id;
    document.getElementById('billSectionNumber').value = bill.section_number;
    document.getElementById('billTitle').value = bill.title;
    document.getElementById('billCategory').value = bill.category;
    document.getElementById('billContent').value = bill.content;

    document.getElementById('modalTitle').textContent = 'Edit Bill Section';
    document.getElementById('billModal').style.display = 'flex';
  } catch (error) {
    showAlert('Failed to load bill section.', 'danger', 'modalAlert');
  }
}

// Save bill (create or update)
document.addEventListener('DOMContentLoaded', () => {
  const billForm = document.getElementById('billForm');
  if (billForm) {
    billForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = document.getElementById('billId').value;
      const data = {
        section_number: document.getElementById('billSectionNumber').value,
        title: document.getElementById('billTitle').value,
        category: document.getElementById('billCategory').value,
        content: document.getElementById('billContent').value
      };

      try {
        const url = id ? `${API_URL}/bills/${id}` : `${API_URL}/bills`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(data)
        });

        if (response.ok) {
          showAlert(id ? 'Bill section updated!' : 'Bill section created!', 'success', 'modalAlert');
          closeBillModal();
          loadBillSections();
          loadStatistics();
        } else {
          const result = await response.json();
          showAlert(result.message || 'Operation failed.', 'danger', 'modalAlert');
        }
      } catch (error) {
        showAlert('Network error.', 'danger', 'modalAlert');
      }
    });
  }
});

// Delete bill
async function deleteBill(id) {
  if (!confirm('Are you sure you want to delete this bill section?')) return;

  try {
    const response = await fetch(`${API_URL}/bills/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      loadBillSections();
      loadStatistics();
    } else {
      showAlert('Failed to delete bill section.', 'danger');
    }
  } catch (error) {
    showAlert('Network error.', 'danger');
  }
}

// Delete feedback
async function deleteFeedback(id) {
  if (!confirm('Are you sure you want to delete this feedback?')) return;

  try {
    const response = await fetch(`${API_URL}/feedback/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (response.ok) {
      loadFeedback();
      loadStatistics();
    } else {
      showAlert('Failed to delete feedback.', 'danger');
    }
  } catch (error) {
    showAlert('Network error.', 'danger');
  }
}

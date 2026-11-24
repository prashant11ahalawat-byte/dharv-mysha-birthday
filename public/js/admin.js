/**
 * Admin Portal Box Office Logic
 * PIN Authentication, Real-time Metrics, Guest List with Search, CSV Export & XSS Safety
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginGate = document.getElementById('pin-login-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const pinForm = document.getElementById('pin-form');
  const pinInput = document.getElementById('admin-pin-input');
  const pinError = document.getElementById('pin-error');
  const btnPinSubmit = document.getElementById('btn-pin-submit');

  const btnRefresh = document.getElementById('btn-refresh-data');
  const btnExport = document.getElementById('btn-export-csv');
  const btnLogout = document.getElementById('btn-logout');
  const searchInput = document.getElementById('search-guests-input');
  const tableBody = document.getElementById('guest-table-body');
  const searchStatusInfo = document.getElementById('search-status-info');

  let currentRSVPs = [];
  let authToken = sessionStorage.getItem('admin_token') || '';

  // 1. Check Initial Authentication Status
  checkAuthStatus();

  async function checkAuthStatus() {
    try {
      const res = await fetch('/api/admin/status', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.authenticated) {
        showDashboard();
      } else {
        showLoginGate();
      }
    } catch (err) {
      showLoginGate();
    }
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['X-Admin-Token'] = authToken;
    }
    return headers;
  }

  function showLoginGate() {
    dashboard.style.display = 'none';
    loginGate.style.display = 'flex';
    if (pinInput) {
      pinInput.value = '';
      pinInput.focus();
    }
  }

  function showDashboard() {
    loginGate.style.display = 'none';
    dashboard.style.display = 'block';
    loadDashboardData();
  }

  // 2. PIN Login Handler
  pinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (!pin) return;

    btnPinSubmit.disabled = true;
    btnPinSubmit.textContent = 'Verifying...';
    hidePinError();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid PIN');
      }

      authToken = data.token || '';
      sessionStorage.setItem('admin_token', authToken);
      showDashboard();
    } catch (err) {
      showPinError(err.message || 'Incorrect PIN. Please try again.');
      pinInput.select();
    } finally {
      btnPinSubmit.disabled = false;
      btnPinSubmit.textContent = 'Unlock Box Office';
    }
  });

  function showPinError(msg) {
    if (pinError) {
      pinError.textContent = msg;
      pinError.style.display = 'block';
    }
  }

  function hidePinError() {
    if (pinError) {
      pinError.style.display = 'none';
      pinError.textContent = '';
    }
  }

  // 3. Load Dashboard Data & Metrics
  async function loadDashboardData() {
    try {
      if (btnRefresh) btnRefresh.classList.add('loading');

      const res = await fetch('/api/admin/data', {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        // Session expired
        sessionStorage.removeItem('admin_token');
        showLoginGate();
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch data');

      const { summary, rsvps } = await res.json();
      currentRSVPs = rsvps || [];

      renderMetrics(summary);
      renderTable(currentRSVPs);

    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      if (btnRefresh) btnRefresh.classList.remove('loading');
    }
  }

  // Render Metric Stat Cards
  function renderMetrics(summary) {
    if (!summary) return;
    document.getElementById('stat-families-going').textContent = summary.families_attending ?? 0;
    document.getElementById('stat-total-guests').textContent = summary.total_guests ?? 0;
    document.getElementById('stat-adults').textContent = summary.total_adults ?? 0;
    document.getElementById('stat-kids').textContent = summary.total_kids ?? 0;
    document.getElementById('stat-cant-make-it').textContent = summary.cant_make_it ?? 0;
    document.getElementById('stat-total-responses').textContent = summary.total_responses ?? 0;
  }

  // Strict HTML Escaping to prevent XSS
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Format ISO Date nicely
  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  }

  // Render Table Rows with Escaping
  function renderTable(rsvps) {
    tableBody.innerHTML = '';

    if (!rsvps || rsvps.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9" class="empty-table-state">
            <div class="empty-icon">🎟️</div>
            <p>No RSVPs found yet. Responses submitted on the invite page will appear here.</p>
          </td>
        </tr>
      `;
      if (searchStatusInfo) {
        searchStatusInfo.textContent = '0 records';
      }
      return;
    }

    if (searchStatusInfo) {
      searchStatusInfo.textContent = `Showing ${rsvps.length} of ${currentRSVPs.length} responses`;
    }

    rsvps.forEach((r) => {
      const isAttending = r.attending === 1 || r.attending === true;
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td class="guest-name-cell">
          ${escapeHTML(r.name)}
        </td>
        <td>
          <span class="status-badge ${isAttending ? 'attending' : 'declined'}">
            ${isAttending ? '🍿 Attending' : '💌 Declined'}
          </span>
        </td>
        <td class="count-cell">${isAttending ? escapeHTML(r.adults) : '-'}</td>
        <td class="count-cell">${isAttending ? escapeHTML(r.kids) : '-'}</td>
        <td class="count-cell" style="font-size: 1.05rem; color: #fff;">
          ${isAttending ? escapeHTML(r.total_guests) : '-'}
        </td>
        <td>
          ${r.phone ? `<a href="tel:${escapeHTML(r.phone)}" style="color: #60a5fa; text-decoration: none;">${escapeHTML(r.phone)}</a>` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td class="message-cell">
          ${r.message ? `"${escapeHTML(r.message)}"` : '<span style="color: #64748b;">—</span>'}
        </td>
        <td class="time-cell">
          ${formatDate(r.created_at)}
        </td>
        <td style="text-align: right;">
          <button type="button" class="btn-delete-row" data-id="${r.id}" title="Delete this entry" aria-label="Delete RSVP from ${escapeHTML(r.name)}">
            🗑️
          </button>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    // Attach Delete Handlers
    tableBody.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (!confirm('Are you sure you want to remove this RSVP entry?')) return;

        try {
          const res = await fetch(`/api/admin/rsvp/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
          });
          if (res.ok) {
            loadDashboardData();
          } else {
            alert('Unable to delete entry.');
          }
        } catch (err) {
          alert('Network error while deleting entry.');
        }
      });
    });
  }

  // 4. Real-time Search / Filter
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderTable(currentRSVPs);
      return;
    }

    const filtered = currentRSVPs.filter(r => {
      const name = (r.name || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      const message = (r.message || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || message.includes(query);
    });

    renderTable(filtered);
  });

  // 5. Refresh Button
  btnRefresh.addEventListener('click', () => {
    loadDashboardData();
  });

  // 6. CSV Export Button
  btnExport.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/admin/export-csv', {
        headers: getAuthHeaders()
      });

      if (res.status === 401) {
        showLoginGate();
        return;
      }

      if (!res.ok) throw new Error('Failed to generate CSV export');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `dharv-mysha-birthday-rsvps-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading CSV: ' + err.message);
    }
  });

  // 7. Logout Button
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (e) {
      // ignore
    }
    authToken = '';
    sessionStorage.removeItem('admin_token');
    showLoginGate();
  });
});

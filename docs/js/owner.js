import { requireRole, logout, createBarber, removeBarber, showMessage, friendlyError } from "./auth.js";
import { listBarbers, allBookings } from "./bookings.js";

document.getElementById("logout-btn").addEventListener("click", logout);

const staffForm = document.getElementById("staff-form");
const staffMsg = document.getElementById("staff-msg");
const staffContainer = document.getElementById("staff-container");
const bookingsContainer = document.getElementById("bookings-container");

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

async function loadStaff() {
  try {
    const staff = await listBarbers();
    if (staff.length === 0) {
      staffContainer.innerHTML = '<p class="empty-state">No barbers added yet.</p>';
      return;
    }
    const rows = staff.map(s => `
      <tr>
        <td>${s.full_name || "—"}</td>
        <td>${s.username}</td>
        <td><button class="btn-small btn-danger" data-id="${s.id}">Remove</button></td>
      </tr>
    `).join("");
    staffContainer.innerHTML = `
      <table>
        <thead><tr><th>Name</th><th>Username</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    staffContainer.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => handleRemove(btn.dataset.id));
    });
  } catch (err) {
    staffContainer.innerHTML = `<p class="empty-state">Could not load staff: ${friendlyError(err)}</p>`;
  }
}

async function handleRemove(uid) {
  if (!confirm("Remove this barber's access to the app?")) return;
  try {
    await removeBarber(uid);
    loadStaff();
    loadBookings();
  } catch (err) {
    alert(friendlyError(err));
  }
}

async function loadBookings() {
  try {
    const bookings = await allBookings();
    if (bookings.length === 0) {
      bookingsContainer.innerHTML = '<p class="empty-state">No bookings yet.</p>';
      return;
    }
    const rows = bookings.map(b => `
      <tr>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.customerName}</td>
        <td>${b.barberName}</td>
        <td>${b.service}</td>
        <td>${statusBadge(b.status)}</td>
      </tr>
    `).join("");
    bookingsContainer.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Barber</th><th>Service</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  } catch (err) {
    bookingsContainer.innerHTML = `<p class="empty-state">Could not load bookings: ${friendlyError(err)}</p>`;
  }
}

staffForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(staffMsg, "");
  const full_name = document.getElementById("staff-name").value.trim();
  const phone = document.getElementById("staff-phone").value.trim();
  const username = document.getElementById("staff-username").value.trim();
  const password = document.getElementById("staff-password").value;
  try {
    await createBarber({ username, password, full_name, phone });
    showMessage(staffMsg, `Barber account created for ${full_name || username}.`, false);
    staffForm.reset();
    loadStaff();
  } catch (err) {
    showMessage(staffMsg, friendlyError(err));
  }
});

(async () => {
  const user = await requireRole("owner");
  if (!user) return;
  await loadStaff();
  await loadBookings();
})();

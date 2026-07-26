import { requireRole, logout, friendlyError } from "./auth.js";
import { myBarberBookings, cancelBooking } from "./bookings.js";

document.getElementById("logout-btn").addEventListener("click", logout);

const bookingsContainer = document.getElementById("bookings-container");
let currentUser = null;

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

async function loadBookings() {
  try {
    const bookings = await myBarberBookings(currentUser.uid);
    if (bookings.length === 0) {
      bookingsContainer.innerHTML = '<p class="empty-state">No appointments booked with you yet.</p>';
      return;
    }
    const rows = bookings.map(b => `
      <tr>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.customerName}</td>
        <td>${b.customerPhone || "—"}</td>
        <td>${b.service}</td>
        <td>${statusBadge(b.status)}</td>
        <td>${b.status === "confirmed" ? `<button class="btn-small btn-danger" data-id="${b.id}">Cancel</button>` : ""}</td>
      </tr>
    `).join("");
    bookingsContainer.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Phone</th><th>Service</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    bookingsContainer.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => handleCancel(btn.dataset.id));
    });
  } catch (err) {
    bookingsContainer.innerHTML = `<p class="empty-state">Could not load appointments: ${friendlyError(err)}</p>`;
  }
}

async function handleCancel(id) {
  if (!confirm("Cancel this appointment?")) return;
  try {
    await cancelBooking(id);
    loadBookings();
  } catch (err) {
    alert(friendlyError(err));
  }
}

(async () => {
  currentUser = await requireRole("barber");
  if (!currentUser) return;
  await loadBookings();
})();

import { requireRole, logout, showMessage, friendlyError } from "./auth.js";
import { listBarbers, SERVICES, createBooking, myCustomerBookings, cancelBooking } from "./bookings.js";

document.getElementById("logout-btn").addEventListener("click", logout);

const barberSelect = document.getElementById("barber-select");
const serviceSelect = document.getElementById("service-select");
const bookingForm = document.getElementById("booking-form");
const bookingMsg = document.getElementById("booking-msg");
const bookingsContainer = document.getElementById("bookings-container");

document.getElementById("date-input").min = new Date().toISOString().split("T")[0];

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${status}</span>`;
}

let currentUser = null;
let barbersById = {};

async function loadFormOptions() {
  try {
    const barbers = await listBarbers();
    barbersById = Object.fromEntries(barbers.map(b => [b.id, b]));
    barberSelect.innerHTML = barbers.length
      ? barbers.map(b => `<option value="${b.id}">${b.full_name || b.username}</option>`).join("")
      : '<option value="">No barbers available yet</option>';
    serviceSelect.innerHTML = SERVICES.map(s => `<option value="${s}">${s}</option>`).join("");
  } catch (err) {
    showMessage(bookingMsg, friendlyError(err));
  }
}

async function loadBookings() {
  try {
    const bookings = await myCustomerBookings(currentUser.uid);
    if (bookings.length === 0) {
      bookingsContainer.innerHTML = '<p class="empty-state">No bookings yet — book your first appointment above.</p>';
      return;
    }
    const rows = bookings.map(b => `
      <tr>
        <td>${b.date}</td>
        <td>${b.time}</td>
        <td>${b.barberName}</td>
        <td>${b.service}</td>
        <td>${statusBadge(b.status)}</td>
        <td>${b.status === "confirmed" ? `<button class="btn-small btn-danger" data-id="${b.id}">Cancel</button>` : ""}</td>
      </tr>
    `).join("");
    bookingsContainer.innerHTML = `
      <table>
        <thead><tr><th>Date</th><th>Time</th><th>Barber</th><th>Service</th><th>Status</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    bookingsContainer.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => handleCancel(btn.dataset.id));
    });
  } catch (err) {
    bookingsContainer.innerHTML = `<p class="empty-state">Could not load bookings: ${friendlyError(err)}</p>`;
  }
}

async function handleCancel(id) {
  if (!confirm("Cancel this booking?")) return;
  try {
    await cancelBooking(id);
    loadBookings();
  } catch (err) {
    alert(friendlyError(err));
  }
}

bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(bookingMsg, "");
  const barberId = barberSelect.value;
  const service = serviceSelect.value;
  const date = document.getElementById("date-input").value;
  const time = document.getElementById("time-input").value;
  if (!barberId) {
    showMessage(bookingMsg, "No barber selected.");
    return;
  }
  const barber = barbersById[barberId];
  try {
    await createBooking({
      customerId: currentUser.uid,
      customerName: currentUser.full_name || currentUser.username,
      customerPhone: currentUser.phone || "",
      barberId,
      barberName: barber ? (barber.full_name || barber.username) : "",
      service,
      date,
      time
    });
    showMessage(bookingMsg, "Booking confirmed!", false);
    bookingForm.reset();
    loadBookings();
  } catch (err) {
    showMessage(bookingMsg, friendlyError(err));
  }
});

(async () => {
  currentUser = await requireRole("customer");
  if (!currentUser) return;
  await loadFormOptions();
  await loadBookings();
})();

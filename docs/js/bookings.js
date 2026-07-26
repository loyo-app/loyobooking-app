import { db } from "./firebase-init.js";
import {
  collection, doc, getDocs, query, where, runTransaction, updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const SERVICES = [
  "Adult Haircut",
  "Kids Haircut",
  "Shave",
  "Brazilian Keratin",
  "Korean Perm",
  "Loose Perm"
];

export async function listBarbers() {
  const q = query(collection(db, "users"), where("role", "==", "barber"));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.full_name || a.username).localeCompare(b.full_name || b.username));
}

function sortByDateTime(rows) {
  return rows.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// One booking slot per barber per date/time. Using a deterministic doc ID
// plus a transaction makes "no double-booking" atomic without needing a
// backend: two simultaneous requests for the same slot can't both win.
export async function createBooking({ customerId, customerName, customerPhone, barberId, barberName, service, date, time }) {
  const bookingId = `${barberId}_${date}_${time}`;
  const ref = doc(db, "bookings", bookingId);
  await runTransaction(db, async (t) => {
    const snap = await t.get(ref);
    if (snap.exists() && snap.data().status === "confirmed") {
      throw new Error("That barber already has a booking at this date and time.");
    }
    t.set(ref, {
      customerId,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      barberId,
      barberName: barberName || "",
      service,
      date,
      time,
      status: "confirmed",
      createdAt: Date.now()
    });
  });
}

export async function myCustomerBookings(uid) {
  const q = query(collection(db, "bookings"), where("customerId", "==", uid));
  const snap = await getDocs(q);
  return sortByDateTime(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function myBarberBookings(uid) {
  const q = query(collection(db, "bookings"), where("barberId", "==", uid));
  const snap = await getDocs(q);
  return sortByDateTime(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function allBookings() {
  const snap = await getDocs(collection(db, "bookings"));
  return sortByDateTime(snap.docs.map(d => ({ id: d.id, ...d.data() })));
}

export async function cancelBooking(id) {
  await updateDoc(doc(db, "bookings", id), { status: "cancelled" });
}

import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { createBarberAuthAccount } from "./firebase-secondary.js";

// The app only ever asks people for a username, never an email — this
// converts it to a fake email under the hood since Firebase Auth's
// email/password provider requires an email-shaped identifier.
const EMAIL_DOMAIN = "loyobooking.local";
export function usernameToEmail(username) {
  return `${username.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
}
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_.]{3,30}$/.test(username || "");
}

export async function registerCustomer({ username, password, full_name, phone }) {
  if (!isValidUsername(username)) {
    throw new Error("Username must be 3-30 characters: letters, numbers, dots, or underscores only.");
  }
  const email = usernameToEmail(username);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = {
    username: username.toLowerCase(),
    role: "customer",
    full_name: full_name || "",
    phone: phone || "",
    createdAt: Date.now()
  };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function login({ username, password }) {
  const email = usernameToEmail(username);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    await signOut(auth);
    throw new Error("This account has no profile set up. Ask the shop owner to check your access.");
  }
  return { uid: cred.user.uid, ...snap.data() };
}

export async function logout() {
  await signOut(auth);
}

// Owner-only: create a barber's login + profile.
export async function createBarber({ username, password, full_name, phone }) {
  if (!isValidUsername(username)) {
    throw new Error("Username must be 3-30 characters: letters, numbers, dots, or underscores only.");
  }
  const email = usernameToEmail(username);
  const uid = await createBarberAuthAccount(email, password);
  const profile = {
    username: username.toLowerCase(),
    role: "barber",
    full_name: full_name || "",
    phone: phone || "",
    createdAt: Date.now()
  };
  await setDoc(doc(db, "users", uid), profile);
  return { uid, ...profile };
}

// Owner-only: revoke a barber's access by deleting their profile doc.
// Note: this removes their app access (no profile = can't log in), but the
// underlying Firebase Auth login record itself can only be fully deleted
// from the Firebase console or via the Admin SDK, not from client code.
export async function removeBarber(uid) {
  await deleteDoc(doc(db, "users", uid));
}

// Calls callback(null) if signed out, or callback({uid, ...profile}) once
// we've confirmed the signed-in user's Firestore profile.
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ uid: user.uid, ...snap.data() });
    } catch (err) {
      callback(null);
    }
  });
}

// Guards a dashboard page: redirects to login unless the signed-in user's
// role matches. Returns a Promise resolving to the user profile.
export function requireRole(role) {
  return new Promise((resolve) => {
    const unsubscribe = watchAuthState((user) => {
      unsubscribe();
      if (!user || user.role !== role) {
        window.location.href = "index.html";
        resolve(null);
      } else {
        resolve(user);
      }
    });
  });
}

export function goToDashboard(role) {
  if (role === "owner") window.location.href = "owner.html";
  else if (role === "barber") window.location.href = "barber.html";
  else if (role === "customer") window.location.href = "customer.html";
  else window.location.href = "index.html";
}

export function showMessage(el, text, isError = true) {
  el.textContent = text;
  el.className = isError ? "msg msg-error" : "msg msg-success";
  el.style.display = text ? "block" : "none";
}

// Turns Firebase's verbose error codes into plain language.
export function friendlyError(err) {
  const code = err && err.code;
  const map = {
    "auth/email-already-in-use": "That username is already taken.",
    "auth/invalid-email": "That username isn't valid.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/wrong-password": "Incorrect username or password.",
    "auth/user-not-found": "Incorrect username or password.",
    "auth/invalid-credential": "Incorrect username or password.",
    "auth/too-many-requests": "Too many attempts — please wait a moment and try again."
  };
  return map[code] || err.message || "Something went wrong.";
}

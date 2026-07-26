import { auth } from "./firebase-init.js";
import { registerCustomer, login, watchAuthState, goToDashboard, showMessage, friendlyError } from "./auth.js";

const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const msgEl = document.getElementById("msg");

// If already signed in, skip straight to the right dashboard.
watchAuthState((user) => {
  if (user) goToDashboard(user.role);
});

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.style.display = "block";
  registerForm.style.display = "none";
  showMessage(msgEl, "");
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.style.display = "block";
  loginForm.style.display = "none";
  showMessage(msgEl, "");
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(msgEl, "");
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value;
  try {
    const user = await login({ username, password });
    goToDashboard(user.role);
  } catch (err) {
    showMessage(msgEl, friendlyError(err));
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage(msgEl, "");
  const full_name = document.getElementById("reg-name").value.trim();
  const phone = document.getElementById("reg-phone").value.trim();
  const username = document.getElementById("reg-username").value.trim();
  const password = document.getElementById("reg-password").value;
  try {
    const user = await registerCustomer({ username, password, full_name, phone });
    goToDashboard(user.role);
  } catch (err) {
    showMessage(msgEl, friendlyError(err));
  }
});

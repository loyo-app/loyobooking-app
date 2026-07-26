# Loyobooking-app

A barbershop booking system with three dashboards:

- **Owner** — creates barber logins (username + password), sees every booking shop-wide.
- **Barber** — sees who's booked with them and when.
- **Customer** — signs up, picks a barber and a service, books a date/time, sees their own bookings.

Services offered: Adult Haircut, Kids Haircut, Shave, Brazilian Keratin, Korean Perm, Loose Perm.

## Architecture

Everything lives in `frontend/` — plain HTML/CSS/JS, no build step, no separate backend server. It talks directly to:

- **Firebase Authentication** (email/password provider) for logins.
- **Cloud Firestore** for user profiles and bookings.

Because there's no backend to host, the whole thing deploys as a static site to **GitHub Pages**, and Firebase's free "Spark" plan covers Auth + Firestore for a small shop's traffic.

People never see or type an "email" — the app quietly converts each username into `username@loyobooking.local` behind the scenes, since Firebase's email/password provider needs an email-shaped ID.

---

## Part 1 — Set up Firebase

Your project (`loyobooking-app`) and its config are already wired into `frontend/js/firebase-config.js`. You still need to turn a few things on:

1. Go to the [Firebase console](https://console.firebase.google.com) → your `loyobooking-app` project.
2. **Authentication → Get started → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** → start in **production mode** (any region close to you is fine).
4. **Firestore Database → Rules** tab → replace the contents with everything in `firestore.rules` from this repo → **Publish**.
5. **Authentication → Settings → Authorized domains** → add your GitHub Pages domain once you know it (e.g. `yourusername.github.io`). Without this step, sign-in will fail once the site is live (it works fine on `localhost` by default).

## Part 2 — Create the first owner account (one-time, manual)

Since only an existing owner can create barber accounts, and there's no owner yet, you create the very first one directly in the console:

1. **Authentication → Users → Add user.**
   - Email: `owner@loyobooking.local`
   - Password: choose something strong — this is your owner login password.
2. Copy the **User UID** shown for that new user.
3. **Firestore Database → Data → Start collection** → collection ID: `users`.
4. **Document ID:** paste the UID you copied. Add these fields:
   | Field | Type | Value |
   |---|---|---|
   | `username` | string | `owner` |
   | `role` | string | `owner` |
   | `full_name` | string | your name / shop name |
   | `phone` | string | (optional) |
   | `createdAt` | number | any number, e.g. `0` |
5. Save.

You can now log into the app with username `owner` and the password you chose.

## Part 3 — Deploy the frontend to GitHub Pages

1. Push this repo to GitHub (e.g. as `Loyobooking-app`).
2. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`.
   - If your GitHub Pages settings let you choose a subfolder, pick `/frontend`.
   - If not, the simplest fix: move everything currently inside `frontend/` up into a `/docs` folder at the repo root, and set Pages to serve from `/docs` (GitHub Pages supports root or `/docs` natively).
3. Your site goes live at `https://yourusername.github.io/Loyobooking-app/` (or wherever Pages points).
4. Go back to **Firebase console → Authentication → Settings → Authorized domains** and make sure that exact domain is on the list (see Part 1, step 5) — this is the #1 cause of "login silently fails" on a freshly deployed site.

## Using the app

- **Owner** logs in with `owner` / the password set in Part 2, then adds barbers from the dashboard (pick each barber's username and password).
- **Barbers** log in with the credentials the owner gave them and see their upcoming appointments.
- **Customers** sign up for themselves from the "New Customer" tab on the login page, then book a barber, service, date, and time.

## Local development

No build step needed — just open `frontend/index.html` in a browser, or serve the `frontend` folder with any static file server (e.g. `npx serve frontend`). It talks to the live Firebase project directly, so there's no separate local server to run.

## Notes & known limitations

- Anyone can self-register as a customer; owner/barber accounts can only be created by the owner.
- Double-booking the same barber at the same date/time is prevented atomically (each slot is a uniquely-named booking document), but there's no concept of shop opening hours yet.
- Removing a barber from the owner dashboard removes their access to the app (deletes their profile), but their underlying Firebase Auth login record isn't deleted — that can only be done from the Firebase console (**Authentication → Users** → delete) or with the Admin SDK, not from the browser.
- There's no password-reset flow yet — the owner can't reset a barber's password once set, so plan a way to communicate credentials to staff, or delete-and-recreate their account if needed.
- All data lives in Firestore; back it up periodically from **Firestore → Data → Export** if that matters to you (export requires the Blaze plan, so on Spark, manually copying data is the fallback).

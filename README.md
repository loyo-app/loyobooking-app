# Loyobooking-app

A barbershop booking system with three dashboards:

- **Owner** — creates barber accounts (username + password), sees all bookings shop-wide.
- **Barber** — sees who's booked with them and when.
- **Customer** — signs up, picks a barber and a service, books a date/time, sees their own bookings.

Services offered: Adult Haircut, Kids Haircut, Shave, Brazilian Keratin, Korean Perm, Loose Perm.

## Architecture

- `frontend/` — plain HTML/CSS/JS, no build step. Deployed to **GitHub Pages**.
- `backend/` — Node.js + Express API with a PostgreSQL database. Deployed to **Railway** (free plan).

GitHub Pages only serves static files, so the backend runs separately on Railway, and the frontend calls it over the network.

---

## Part 1 — Deploy the backend to Railway

1. Go to [railway.app](https://railway.app) and sign in (free plan is fine).
2. **New Project → Deploy from GitHub repo** — pick this repo. When it asks for a root directory / start command, set the **root directory to `backend`** (Railway's project settings → this ensures it only builds the backend folder).
   - If Railway doesn't offer a root-directory option in your version, instead push the `backend` folder as its own separate GitHub repo and deploy that.
3. **Add a database:** in the Railway project, click **+ New → Database → PostgreSQL**. Railway automatically creates a `DATABASE_URL` variable and shares it with your backend service.
4. On your backend service, go to **Variables** and add:
   - `JWT_SECRET` — any long random string (e.g. generate one at randomkeygen.com).
   - `FRONTEND_ORIGIN` — your future GitHub Pages URL, e.g. `https://yourusername.github.io`.
   - `OWNER_USERNAME` and `OWNER_PASSWORD` — credentials for the shop owner's login (used only once, to seed the account).
5. Deploy. Once it's live, open **Settings → Networking** and generate a public domain, e.g. `https://loyobooking-backend-production.up.railway.app`. This is your `API_BASE_URL`.
6. **Run the migration once** to create the database tables and the owner account. In the Railway dashboard, open the backend service's shell (or run locally with the `DATABASE_URL` copied into a local `.env`) and run:
   ```
   npm install
   npm run migrate
   ```
   This creates the `users` and `bookings` tables and one owner login using `OWNER_USERNAME` / `OWNER_PASSWORD`.
7. Test it: visiting `https://your-backend-url.up.railway.app/api/health` should return `{"ok":true}`.

## Part 2 — Deploy the frontend to GitHub Pages

1. Open `frontend/js/config.js` and replace the placeholder with your real Railway URL:
   ```js
   const API_BASE_URL = "https://loyobooking-backend-production.up.railway.app";
   ```
2. Push this repo to GitHub (repo name can be `Loyobooking-app`).
3. In the repo, go to **Settings → Pages**.
   - Source: **Deploy from a branch**.
   - Branch: `main`, folder: pick `/frontend` if GitHub offers a subfolder option; otherwise see the note below.
4. **If GitHub Pages won't let you pick `/frontend` as the folder:** the simplest fix is to move the contents of `frontend/` into a `/docs` folder at the repo root (GitHub Pages supports root or `/docs`), then set Pages to serve from `/docs`. Or, publish only the `frontend` folder to a separate repo dedicated to the site.
5. Your site will be live at `https://yourusername.github.io/Loyobooking-app/` (or `.../repo-name/` matching whatever you picked as the Pages source).
6. Double check `FRONTEND_ORIGIN` on Railway matches this exact URL (including `https://` and no trailing slash issues) so CORS allows the browser to talk to your API.

## Using the app

- **Owner** logs in with the `OWNER_USERNAME` / `OWNER_PASSWORD` you set in Railway, then uses the dashboard to create barber accounts (pick a username/password for each barber).
- **Barbers** log in with the credentials the owner gave them and see their upcoming appointments.
- **Customers** sign up for themselves from the "New Customer" tab on the login page, then book a barber, service, date, and time.

## Local development

Backend:
```
cd backend
npm install
cp .env.example .env   # fill in a local Postgres DATABASE_URL, or point at Railway's
npm run migrate
npm start
```

Frontend: just open `frontend/index.html` in a browser (point `config.js` at `http://localhost:3000` while testing locally), or serve it with any static file server.

## Notes & things you may want to extend later

- Anyone can self-register as a customer; owner/barber accounts can only be created by the owner.
- Booking clashes are prevented per barber per date/time slot, but there's no concept of shop opening hours yet — you may want to restrict selectable times.
- Passwords are hashed with bcrypt; sessions use JWTs stored in the browser's `localStorage`.
- There's no password-reset flow yet — the owner can only add/remove barbers, not reset passwords, so plan a way to communicate credentials to staff.

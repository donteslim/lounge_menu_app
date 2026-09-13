# The Lounge — Menu App

## Starting the app

**Do not open `public/index.html` directly by double-clicking it.** This is a real web app with a server backend — the menu and admin login only work when loaded through that server.

Two ways to start:

1. **Double-click `start.bat`** in this folder. It starts the server and opens `http://localhost:3000` in your default browser automatically.
2. Or manually: run `npm start` in this folder, then open `http://localhost:3000` in your browser.

## Admin login

- URL: `http://localhost:3000/admin` (or click the "Admin Login" button in the site header)
- Username: `admin`
- Password: `ChangeMe123!`

Change this password after your first login using the **Change Password** button in the admin dashboard.

## What's inside

- Public menu (`/`): tabbed sections (Champagnes, Beers, Food, Soft Drinks by default), each showing its items with name, description, and price (with discount price shown when set).
- Admin dashboard (`/admin`): add/edit/delete sections and the products within them.
- Data is stored in `data/db.json`, created automatically on first run.

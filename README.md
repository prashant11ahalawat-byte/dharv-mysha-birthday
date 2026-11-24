# 🎬 Dharv & Mysha's Birthday Movie Party RSVP Website

A complete, publishable birthday party RSVP website and private Admin Portal built for **Dharv Pratap** (turning 6) and **Mysha** (turning 9) celebrating at **PVR Cinemas, Forum Nexus Mall**.

Built with a fast, zero-build **Node.js + Express + SQLite** stack, featuring a cinematic movie-ticket design, live countdown, celebratory canvas confetti, persistent database storage, and a PIN-protected Box Office admin portal with CSV export.

---

## 🎟️ The Two URLs

| Portal | URL | Description |
| :--- | :--- | :--- |
| **Public Invitation** | `http://localhost:3000/` | Cinematic movie-ticket invite, live countdown, party details, and interactive RSVP form. |
| **Admin Portal** | `http://localhost:3000/admin` | Unlinked, PIN-protected dashboard with live guest counts, search, CSV export, and deletion. |

---

## 🍿 Event Details (Confirmed)

- **Headline:** "You're invited to a MOVIE PARTY"
- **Tagline:** "Two birthdays, one big screen, and all the popcorn you can eat. Come celebrate with us!"
- **Birthday Stars:**
  - **Dharv Pratap** — Birthday Boy — turning **6** (Blue poster card)
  - **Mysha** — Birthday Girl — turning **9** (Pink poster card)
- **Date:** Thursday, 10 December 2026
- **Time:** 4:30 – 7:30 PM (evening show)
- **Venue:** PVR Cinemas, Forum Nexus Mall
- **Fun Includes:** Slide & popcorn (Kids' movie theatre experience)
- **Family Note:** "Parents, please join us! Grown-ups are welcome too — bring the whole family and make it a movie night to remember."
- **Ticket Stub:** "Admit: The Whole Family"
- **Footer:** "Made with ♥ for Mysha & Dharv Pratap"

---

## 🚀 Quick Start (Run Locally)

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, including v20, v22, and v26)
- **npm** (comes with Node.js)

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm start
```
*Or for automatic restart during editing:*
```bash
npm run dev
```

The console will display:
```
====================================================
🎬 Birthday Party RSVP Website is running!
🍿 Public Invitation: http://localhost:3000/
🎟️ Admin Portal:      http://localhost:3000/admin
🔑 Configured Admin PIN: [2026] (set via ADMIN_PIN env var)
====================================================
```

Open `http://localhost:3000/` in your browser to view the invite!

---

## 🔑 How to Set / Change the Admin PIN

The default PIN is `2026`. You can change it in one place:

1. Open the `.env` file in the project root:
   ```env
   # Set your secret numeric PIN here (e.g. 4 to 8 digits)
   ADMIN_PIN=2026
   ```
2. When deploying to production (e.g. Render, Railway, Fly.io), set `ADMIN_PIN` in your host's **Environment Variables** dashboard.
3. If no environment variable is provided, the server falls back to the default PIN configured in `config.js`.

---

## 📦 Project Structure

```
dharv-mysha-birthday/
├── .env                  # Environment variables (ADMIN_PIN, PORT, etc.)
├── .env.example          # Sample environment variables
├── .gitignore            # Git ignore rules (node_modules, rsvps.db, .env)
├── package.json          # Project metadata and dependencies
├── config.js             # Centralized application configuration
├── db.js                 # SQLite database adapter (better-sqlite3 with node:sqlite fallback)
├── server.js             # Express web server, API routes, security headers & PIN auth
├── README.md             # Documentation and deployment guides
└── public/
    ├── index.html        # Public Movie Party ticket invitation & RSVP page
    ├── admin.html        # Private Admin Box Office Portal (unlinked from public page)
    ├── css/
    │   ├── style.css     # Cinematic ticket styling, typography, responsive & animations
    │   ├── print.css     # Clean print stylesheet for saving/printing invitation as PDF
    │   └── admin.css     # Clean, modern cinema Box Office dashboard styling
    └── js/
        ├── confetti.js   # Zero-dependency, 60fps canvas confetti particle engine
        ├── invite.js     # Live countdown, guest counters, client validation & submission
        └── admin.js      # PIN gate, metrics loading, search, CSV export, XSS-safe table
```

---

## 🌟 Key Features

### Public Invitation Page (`/`)
- **Cinematic Ticket Aesthetic:** Deep midnight-purple background (`#0c071e`), cream ticket card (`#fffcf4`), gold foil borders, and coral accents.
- **Top Marquee:** Infinite scrolling `"NOW SHOWING ★ NOW SHOWING ★"` banner with `prefers-reduced-motion` compliance.
- **Star Poster Cards:** Side-by-side VIP cards (Blue for Dharv, Pink for Mysha) with bold gold 3D age badges (`6` and `9`).
- **2×2 Details Grid:** Clean uppercase labeled blocks for Date, Time, Venue, and Fun Includes.
- **Perforated Ticket Divider:** Realistic circular notch cutouts with dashed tear line (`✂ TEAR HERE ✂`).
- **Live Countdown:** Accurate countdown to `10 December 2026 at 4:30 PM IST`.
- **Canvas Confetti:** Zero-dependency canvas confetti on page load and on RSVP confirmation.
- **RSVP Form:**
  - Attending ("Yes, count us in!") vs Regrets ("Sorry, can't make it").
  - Name (required).
  - Number of Adults & Number of Kids with friendly stepper buttons (`+` / `−`) and live total guest preview.
  - Optional Phone and Birthday Wishes textarea.
  - Client & server-side validation.
  - Duplicate submit protection (locks button, shows spinner, and deduplicates within 10s).
- **Print Stylesheet:** Click the **"Print / Save Invitation as PDF"** button or press `Cmd+P` / `Ctrl+P` to generate a high-contrast, clean physical or PDF invitation card without web forms.

### Admin Portal (`/admin`)
- **Protected by PIN:** Secure PIN gate with attempt rate-limiting.
- **Summary Metrics (6 Cards):**
  1. Families Going (attending groups)
  2. Total Guests Coming (adults + kids)
  3. Adults
  4. Kids
  5. Can't-Make-It Count
  6. Total Responses
- **Full Guest List Table:** Displays Name, Status, Adults, Kids, Total, Phone, Wishes, and Timestamp.
- **Security:** Strict HTML escaping on all guest input before rendering to prevent XSS.
- **Instant Search:** Filter table rows in real-time by guest name, phone, or message.
- **Refresh & Delete:** Refresh without page reload, and option to remove test entries.
- **CSV Export:** One-click download of all responses as an RFC-4180 compliant `.csv` file.

---

## ☁️ Deployment Instructions (Free / Low-Cost Hosts)

### Option 1: Render (Recommended — Free Web Service)
1. Push this directory to a GitHub / GitLab repository.
2. Sign in to [render.com](https://render.com) and click **New > Web Service**.
3. Select your repository.
4. Set the following settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Under **Environment Variables**, add:
   - `ADMIN_PIN`: `your-secret-numeric-pin`
   - `SESSION_SECRET`: `any-random-secret-string`
6. Click **Create Web Service**. Your website will be live in 1-2 minutes!
*(Note: On Render's free tier, you can add a free persistent disk if you want the SQLite `.db` file to survive free-tier container sleep restarts, or deploy on Railway/Fly).*

---

### Option 2: Railway (Free / Low-Cost with Persistent Volume)
1. Sign in to [railway.app](https://railway.app).
2. Click **New Project > Deploy from GitHub repo**.
3. Select this repository.
4. Under the service **Settings > Variables**, add:
   - `ADMIN_PIN`: `your-secret-pin`
   - `PORT`: `3000`
5. Under **Volumes**, click **Add Volume** and mount it to `/app/data`, then set `DB_PATH=/app/data/rsvps.db` in Variables so your RSVPs persist permanently across deploys.
6. Generate a public domain under **Settings > Networking > Generate Domain**.

---

### Option 3: Fly.io
1. Install the `flyctl` CLI and login: `fly auth login`.
2. Run `fly launch` in this project directory.
3. Create a persistent volume for SQLite:
   ```bash
   fly volumes create rsvp_data --size 1
   ```
4. Set your admin PIN secret:
   ```bash
   fly secrets set ADMIN_PIN=2026
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

---

### Option 4: Glitch (Instant 1-Click Zero Setup)
1. Go to [glitch.com](https://glitch.com).
2. Click **New Project > Import from GitHub** (or drag & drop files).
3. In the Glitch file sidebar, open `.env` and set:
   ```env
   ADMIN_PIN=2026
   ```
4. Glitch automatically installs packages and starts the server immediately. Click **Share > Live Site** to get your public URL.

---

## 🧪 Testing Locally

To verify all components locally:
1. Start the server: `npm start`.
2. Open `http://localhost:3000/` and submit an RSVP.
3. Open `http://localhost:3000/admin`, enter PIN `2026`, and verify that the metrics and guest list reflect your submission instantly.
4. Try typing in the search box to filter results, or click **Export CSV** to test downloading the guest list spreadsheet.

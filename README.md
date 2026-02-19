# StreamToStage — React App

## Quick Start (for your existing GitHub repo)

### Option A: Just upload the `docs/` folder (easiest)
1. Download this project
2. Copy the entire `docs/` folder into your `livestream-tips` repo
3. In GitHub → Settings → Pages → set source to "Deploy from a branch"
4. Set branch to `main` and folder to `/docs`
5. Push and wait ~1 min. Your site is live!

### Option B: Full development setup (if you want to make changes)

**One-time setup:**
```bash
# Clone your repo
git clone https://github.com/wolfe8105/livestream-tips.git
cd livestream-tips

# Copy all the project files into it (everything except node_modules)
# Then install dependencies:
npm install
```

**Making changes:**
```bash
# Edit any file in src/
# Then rebuild:
npm run build

# This updates the docs/ folder automatically
# Then push to GitHub:
git add .
git commit -m "update"
git push
```

**Test locally before pushing:**
```bash
npm run dev
# Opens at http://localhost:5173/livestream-tips/
```

---

## Project Structure

```
streamtostage/
├── docs/                  ← GitHub Pages serves this (DON'T edit directly)
├── index.html             ← Entry point for Vite
├── vite.config.js         ← Build config
├── package.json           ← Dependencies
│
└── src/
    ├── main.jsx           ← React entry point
    ├── App.jsx            ← Routes + global state
    ├── index.css          ← All styles (CSS variables, components)
    │
    ├── services/          ← ⭐ THE KEY FILES — swap mocks for real backends
    │   ├── database.js    ← localStorage now → your API/Firebase later
    │   ├── auth.js        ← Mock login → real OAuth/JWT later
    │   ├── payments.js    ← Mock purchases → CCBill/crypto later
    │   ├── streaming.js   ← Placeholder → Ant Media Server later
    │   ├── chat.js        ← In-memory → WebSocket later
    │   └── helpers.js     ← Utility functions (search, random, etc.)
    │
    ├── data/
    │   └── constants.js   ← Club data, state names, performer names
    │
    ├── components/
    │   ├── Layout.jsx     ← Header + bottom nav (wraps all pages)
    │   └── BottomSheet.jsx← Reusable slide-up sheet
    │
    └── pages/
        ├── Browse.jsx     ← Home page: hero, search, states, clubs
        ├── Room.jsx       ← Streaming room: tips, lovense, chat, private shows
        ├── Profile.jsx    ← Performer profile: schedule, booking
        ├── Tokens.jsx     ← Token purchase packages
        └── Dashboard.jsx  ← Viewer stats + Performer settings (role switch)
```

---

## How to Swap Services for Production

Each service file in `src/services/` has comments at the top showing exactly what to replace. Here's the summary:

### database.js (data storage)
**Now:** localStorage (browser-only)
**Swap:** Change `_get()`, `_set()`, `_del()` to call your REST API or Firebase

### auth.js (login/signup)
**Now:** Mock (always "logged in")
**Swap:** Firebase Auth, or your own JWT endpoint

### payments.js (buying tokens)
**Now:** Instantly adds tokens (no real payment)
**Swap:** CCBill payment form redirect, or crypto wallet

### streaming.js (video)
**Now:** Shows avatar placeholder
**Swap:** Ant Media Server WebRTC connection

### chat.js (real-time chat)
**Now:** In-memory array (resets on refresh)
**Swap:** WebSocket connection to your server

---

## Token Economy
- $0.10 per token
- $0.055 streamer payout (55%)
- Packages: 100/$4.99, 500/$19.99, 1200/$39.99, 5000/$149.99

## GitHub Pages URL
https://wolfe8105.github.io/livestream-tips/

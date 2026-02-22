# StreamToStage — Frontend

**Watch Live, Visit Real**

React + Vite progressive web app for the StreamToStage platform. Deployed to GitHub Pages.

## Quick Start

```bash
npm install
npm run dev        # Local dev server at localhost:5173
npm run build      # Build to docs/ for GitHub Pages
```

## Architecture

```
src/
├── App.jsx                 # Router + AppContext provider
├── main.jsx                # Entry point
├── index.css               # All styles
├── components/
│   ├── Layout.jsx          # Nav + page wrapper
│   └── BottomSheet.jsx     # Mobile bottom sheet
├── data/
│   └── constants.js        # Clubs, states, config
├── pages/                  # 16 page components
│   ├── Login.jsx           # Auth (login/signup/demo)
│   ├── Browse.jsx          # Browse performers
│   ├── Room.jsx            # Live stream viewer
│   ├── GoLive.jsx          # Broadcaster page
│   ├── Dashboard.jsx       # Performer dashboard
│   ├── Earnings.jsx        # Earnings & payouts
│   ├── Profile.jsx         # Performer profile
│   ├── Tokens.jsx          # Buy tokens (crypto)
│   ├── Notifications.jsx   # Notification center
│   ├── LovenseSetup.jsx    # Lovense toy integration
│   ├── Admin.jsx           # Admin dashboard
│   ├── Antifraud.jsx       # Anti-fraud controls
│   ├── BotShield.jsx       # Bot detection
│   ├── SecurityKeys.jsx    # WebAuthn/FIDO2 keys
│   ├── Compliance.jsx      # 2257 compliance
│   └── Verification.jsx    # Performer verification
└── services/               # 8 service files
    ├── api.js              # HTTP client, JWT, WebSocket, demo detection
    ├── auth.js             # Login/signup, 2FA, session management
    ├── database.js         # Hybrid cache + API sync (937 lines)
    ├── payments.js         # Crypto purchase flow (USDT/USDC)
    ├── payouts.js          # Wallet verification + withdrawals
    ├── chat.js             # WebSocket chat
    ├── streaming.js        # Ant Media integration
    └── helpers.js          # Formatters, validators, utilities
```

## Demo Mode

The app auto-detects if the backend is running. If no backend found, it runs entirely in demo mode using localStorage — no server needed. GitHub Pages deployment works as a fully functional demo.

## Deployment

GitHub Pages serves from the `docs/` folder:

```bash
npm run build      # Outputs to docs/
git add docs/
git commit -m "Build"
git push
```

## Backend

The Node.js backend lives in a separate repo: **streamtostage-backend**

## Tech Stack

- React 18 + Vite
- HashRouter (GitHub Pages compatible)
- AppContext for global state
- All CSS in index.css (no CSS-in-JS)

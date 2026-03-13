# Vitals — Personal Wellness Tracker

A comprehensive AI-powered wellness tracking app built with React + Vite. Designed for mobile-first use as a Progressive Web App.

## Features

- **Nutrition Tracking** — manual entry or AI photo analysis (snap a pic, get auto macros)
- **Training Log** — exercises, sets/reps/weight, auto PR detection, post-workout feedback
- **Pain Tracking** — body location, severity, triggers, resolution tracking
- **Hydration** — daily goal ring, quick-add buttons, streak tracking
- **Supplement Tracker** — log your full stack with timing and dosage
- **Sleep** — hours, quality, trends
- **Lifestyle** — energy, stress, mood, steps
- **Body Metrics** — weight, measurements, VO2 max estimation
- **Progress Photos** — AI analysis of visible muscle development over time
- **AI Insights** — comprehensive analysis with evolving memory that builds on previous sessions

## Tech Stack

- **React 18** + **Vite** for fast builds
- **Recharts** for data visualization
- **IndexedDB** for on-device persistent storage (no account needed, ~1GB capacity)
- **Anthropic Claude API** for AI features (requires your own API key)

## Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd vitals-app

# Install dependencies
npm install

# Start dev server
npm run dev
```

## Deployment (Vercel — recommended)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repo
3. It auto-detects Vite — just click Deploy
4. Your app is live at `your-project.vercel.app`

### Add to iPhone Home Screen

1. Open your deployed URL in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. It now works like a native app

## API Key Setup

1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Open the app → hamburger menu → Settings
3. Paste your key and save
4. Your key is stored locally on your device only

## Data Storage

- All data stored in **IndexedDB** on your device
- No server, no cloud, no accounts
- Use Settings → Export Backup to save your data as JSON
- Use Settings → Import Backup to restore

## Customization

The app is personalized for a 25-year-old male focused on muscle mass, explosiveness, and strength with a dairy allergy. To customize:

- Edit `DEF.profile` in `src/App.jsx` for your profile
- Adjust calorie/protein/hydration targets in the component code
- Modify the AI system prompts to match your goals

# My Shopping List — Message Form

A mobile-first React web app with a single form that lets users type or dictate a message and send it to a Make.com webhook.

---

## What It Does

- User types or speaks a message into a textarea
- Taps **Send Message** → the message is POSTed as JSON to a Make.com webhook
- A success or error state is shown inline; the form resets on success

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React 18 | Component model, state management |
| Build tool | Vite 5 | Fast dev server, optimized production build |
| Voice input | Web Speech API (browser-native) | No library, no API key, works on mobile |
| Form submission | Fetch API | No page redirect, inline feedback |
| Styling | Plain CSS | No dependencies, easy to customize |
| Deployment | Vercel | Auto-detects Vite, zero config |

---

## Project Structure

```
/
├── index.html          # HTML entry point — viewport & mobile meta tags
├── vite.config.js      # Vite config with React plugin
├── package.json
├── .gitignore
└── src/
    ├── main.jsx        # React root mount
    ├── index.css       # Global reset and base body styles
    ├── App.jsx         # All app logic and JSX
    └── App.css         # All styles (mobile-first)
```

---

## Key Implementation Details

### Webhook Submission

The form POSTs JSON to Make.com on submit:

```json
{ "message": "the user's text" }
```

The webhook URL is hardcoded at the top of `src/App.jsx`:

```js
const WEBHOOK_URL = 'https://hook.eu2.make.com/...'
```

To change the endpoint, update that constant. Make.com receives the `message` field in the scenario trigger.

### Voice Input

Uses the browser's built-in `SpeechRecognition` API (prefixed as `webkitSpeechRecognition` on iOS Safari).

**How it works:**

1. On mount, the app checks for `SpeechRecognition` support — the mic button only renders if supported
2. When the user taps the mic, a snapshot of the current textarea text is saved (`baseTextRef`)
3. As the user speaks, interim (unconfirmed) text is shown live in the textarea
4. When a speech segment is finalised by the browser, it's locked in (`finalTextRef`)
5. When recording stops (manually or after silence), the textarea reverts to confirmed-final text only — no dangling interim fragments

**Language:** Automatically uses `navigator.language` (the device's OS locale).

**Browser support:**
- Android Chrome — full support
- iOS Safari 14.5+ — works, but `continuous` mode auto-stops after ~10s of silence (iOS limitation, handled gracefully)
- Firefox / some browsers — not supported; the mic button is hidden automatically

---

## Local Development

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`.

---

## Production Build

```bash
npm run build
```

Output goes to `/dist`. Preview the build locally with:

```bash
npm run preview
```

---

## Deploying to Vercel

1. Push the project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Vercel auto-detects Vite — no manual config needed
4. Default settings are correct: build command `npm run build`, output directory `dist`
5. Click **Deploy**

---

## Customisation

**Change the webhook URL** — edit `WEBHOOK_URL` in `src/App.jsx`

**Change the page title or heading** — edit `<title>` in `index.html` and `<h1>` in `App.jsx`

**Change colours** — all colours are in `src/App.css`; the primary colour is `#6366f1` (indigo)

**Change the input language for voice** — replace `navigator.language` with a BCP-47 tag (e.g. `'he-IL'`, `'en-US'`) in the `startListening` function in `App.jsx`

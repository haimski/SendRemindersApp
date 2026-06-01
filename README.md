# iRemindMe

A mobile-first React web app that lets users type or dictate a reminder and send it to a Make.com webhook. Supports Hebrew and English with full RTL layout.

---

## What It Does

- User types or speaks a reminder into a textarea
- Taps **Send** → the message is POSTed as JSON to a Make.com webhook
- A success or error state is shown inline; the form resets on success
- Language switcher toggles between Hebrew (RTL) and English (LTR)

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React 18 | Component model, state management |
| Build tool | Vite 5 | Fast dev server, optimized production build |
| Voice input | Web Speech API (browser-native) | No library, no API key, works on mobile |
| Form submission | Fetch API | No page redirect, inline feedback |
| i18n / RTL | Built-in (no library) | Only 2 languages; CSS logical properties handle RTL |
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
    ├── App.jsx         # All app logic and JSX (translations, voice, form)
    └── App.css         # All styles — mobile-first, RTL-aware logical properties
```

---

## Key Implementation Details

### Webhook Submission

The form POSTs JSON to Make.com on submit:

```json
{ "message": "the user's reminder text" }
```

The webhook URL is hardcoded at the top of `src/App.jsx`:

```js
const WEBHOOK_URL = 'https://hook.eu1.make.com/...'
```

To change the endpoint, update that constant. Make.com receives the `message` field in the scenario trigger.

### Internationalisation (Hebrew / English)

Translations are defined in a `T` object at the top of `src/App.jsx`:

```js
const T = {
  en: { title: 'Send A Reminder to Yourself', send: 'Send Message', ... },
  he: { title: 'שלח תזכורת לעצמך', send: 'שלח', ... },
}
```

The active language is stored in a `lang` state (`'he'` by default). Switching language:
- Updates `document.documentElement.lang` and `document.documentElement.dir`
- Sets `dir="rtl"` or `dir="ltr"` on the page root and textarea
- Switches voice recognition to `he-IL` or `en-US`

**To add a new language:** add an entry to `T`, add its speech code to `SPEECH_LANG`, and extend the language toggle logic.

### RTL Layout

RTL is handled entirely via **CSS logical properties** — no duplicate rules needed:

| Physical property | Logical property used | Effect |
|---|---|---|
| `padding-right: 52px` | `padding-inline-end: 52px` | Mic button clearance flips with text direction |
| `right: 10px` | `inset-inline-end: 10px` | Mic button position flips with text direction |
| `right: 0` (lang button) | `inset-inline-end: 0` | Lang button corner flips with text direction |

### Voice Input

Uses the browser's built-in `SpeechRecognition` API (prefixed as `webkitSpeechRecognition` on iOS Safari).

**How it works:**

1. On mount, the app checks for `SpeechRecognition` support — the mic button only renders if supported
2. When the user taps the mic, a snapshot of the current textarea text is saved (`baseTextRef`)
3. As the user speaks, interim (unconfirmed) text is shown live in the textarea
4. When a speech segment is finalised by the browser, it's locked in (`finalTextRef`)
5. When recording stops (manually or after silence), the textarea reverts to confirmed-final text only — no dangling interim fragments

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

**Change the default language** — change `useState('he')` to `useState('en')` in `App.jsx`

**Add or edit translations** — update the `T` object in `src/App.jsx`

**Change colours** — all colours are in `src/App.css`; the primary colour is `#6366f1` (indigo)

**Change the browser tab title** — edit `<title>` in `index.html`

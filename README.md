# iRemindMe

A mobile-first web app that lets users dictate or type reminders and send them instantly to a Make.com automation via webhook.

---

## For Product Managers

### What it does

- User opens the app on their phone
- Types or speaks a reminder (voice-to-text via the mic button)
- Enters their **phone number** — saved automatically on first send, pre-filled on every future visit
- Taps **Send to WhatsApp** — the message and phone number are delivered to the connected Make.com scenario
- The interface is available in **Hebrew** (default, RTL layout) and **English** (LTR layout)
- The app only works in **portrait mode** — rotating to landscape shows a "please rotate" screen

### Phone number behaviour

| Situation | What the user sees |
|---|---|
| First visit | Empty phone input field |
| After first send | Saved number shown, X button to change it |
| User taps X | Input clears immediately, empty field appears |
| User sends with new number | New number replaces old one and is saved |
| User sends with no number | Message is sent, no phone is included, nothing is saved |

### Current status

Phase 2 in progress. Phase 1 (core send flow) is complete and live.

### Supported platforms

| Platform | Voice input | Send |
|---|---|---|
| Android Chrome | ✓ Full support | ✓ |
| iOS Safari 14.5+ | ✓ Works (auto-stops after silence) | ✓ |
| Desktop browsers | ✗ No mic (form still works) | ✓ |

---

## For Developers

### Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → /dist
npm run preview    # preview production build locally
```

### Deploy to Vercel

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com) — Vite is auto-detected
3. Build command: `npm run build`, output: `dist`
4. Click Deploy

---

## Architecture

### Tech stack

| Layer | Choice | Why |
|---|---|---|
| UI framework | React 18 | Component model, hooks |
| Build tool | Vite 5 | Fast dev server, optimised production build |
| State management | **Zustand 5** | Selective re-renders, no provider boilerplate, ~1 KB |
| Voice input | Web Speech API (browser-native) | No library, no API key, works on mobile |
| Webhook | Fetch API — JSON POST | Reliable, Make.com maps JSON fields directly |
| Styling | Plain CSS + CSS custom properties | No dependencies, co-located with components |
| Deployment | Vercel | Auto-detects Vite, zero config |

### File structure

```
src/
├── main.jsx                          # React root — mounts App only
├── index.css                         # Global reset + imports tokens.css
├── App.jsx                           # Thin shell: reads store, owns message state + voice hook
├── App.css                           # Outer layout only (.app, .content)
│
├── styles/
│   └── tokens.css                    # All design tokens as CSS variables (--c-*, --sp-*, --r-*)
│
├── constants/
│   ├── webhook.js                    # WEBHOOK_URL — change this to update the endpoint
│   └── speech.js                     # SPEECH_LANG map { en, he }
│
├── translations/
│   └── index.js                      # All UI strings for both languages (T object)
│
├── store/
│   └── useAppStore.js                # Zustand store — lang, dir, t, setLang
│
├── hooks/
│   └── useSpeechRecognition.js       # Web Speech API hook — returns { isListening, supported, toggle, stop }
│
└── components/
    ├── icons/index.jsx               # All SVG icons (GlobeIcon, MicIcon, StopIcon, ArrowIcon, RotateIcon)
    ├── Navbar/                       # Sticky top bar — brand name + language switcher
    ├── Hero/                         # Page title + subtitle (reads from translations via store)
    ├── MessageForm/                  # Textarea, submit button, status messages (owns submit state)
    ├── BottomBar/                    # Fixed bottom bar with floating mic button
    └── LandscapeBlock/               # Full-screen overlay shown in landscape orientation
```

### State management

Zustand is used for **global state** — state that multiple components need simultaneously. Local `useState` is used for state that belongs to a single component.

| State | Where | Reason |
|---|---|---|
| `lang`, `dir`, `t` | **Zustand store** (`useAppStore`) | Read by Navbar, Hero, MessageForm, LandscapeBlock |
| `message` | `App.jsx` local state | Shared between MessageForm (input) and useSpeechRecognition (base text) |
| `isListening`, `supported` | `useSpeechRecognition` hook | Returned up to App, passed as props to MessageForm + BottomBar |
| `isSubmitting`, `submitStatus` | `MessageForm` local state | Only used inside the form — no other component cares |

**Why Zustand over React Context?**
Context re-renders every consumer when any value changes. Zustand uses subscriptions — a component re-renders only when the specific slice it reads changes. For an app with rapid voice events and language switching, this matters.

**Why no WebSockets?**
WebSockets enable real-time server → client push. This app sends one-way to Make.com and doesn't need a server to push anything back. HTTP fetch is sufficient. If Phase 3 adds a custom backend with delivery confirmations or multi-device sync, WebSockets can be introduced then.

### Voice recognition design

- `interimResults: false` — only final confirmed phrases are accepted. Mobile browsers send interim results word-by-word, which caused flickering. Finals-only gives clean, stable updates.
- `continuous: true` — keeps listening across natural pauses in speech.
- Results are rebuilt from the full `event.results` array on every `onresult` event (idempotent) because `event.resultIndex` is unreliable on mobile Chrome.

### Design system

Colors, spacing and radii are defined as CSS variables in `src/styles/tokens.css` and mapped from the **Modern Utility** design spec (`DESIGN.md`). Component CSS files use these variables (`var(--c-primary)`, `var(--sp-md)`, etc.) — never raw hex values.

### Phone number persistence

Saved using **Zustand `persist` middleware → `localStorage`**. No server required.

- `savedPhone` lives in the Zustand store (`src/store/useAppStore.js`)
- Persisted automatically to `localStorage` under the key `iremindme-storage`
- Survives browser close and reopen on the same device
- Cleared instantly when the user taps X (removed from store + localStorage)
- Saved on successful form submit only — incomplete numbers are never stored

`lang` (language preference) is also persisted the same way.

### Webhook

The Make.com webhook URL lives in `src/constants/webhook.js`:

```js
export const WEBHOOK_URL = 'https://hook.eu1.make.com/...'
```

The app sends a JSON POST. Phone is included only when a number is present:

```json
{ "message": "the user's reminder text", "phone": "+972501234567" }
```

**Important for Make.com:** After changing the webhook URL, open the Make.com scenario, click the webhook module, click **Re-determine data structure**, then send a test message from the app. This updates the field mapping so the active scenario can read `{{1.message}}`.

### Adding a language

1. Add a new entry to `T` in `src/translations/index.js`
2. Add the BCP-47 speech code to `SPEECH_LANG` in `src/constants/speech.js`
3. Update the `setLang` toggle in `src/components/Navbar/Navbar.jsx`
4. Update `useAppStore` initial state if the new language should be the default

### Changing the webhook URL

Edit `WEBHOOK_URL` in `src/constants/webhook.js`. Then follow the Make.com re-mapping step above.

### Changing colours

Edit the relevant `--c-*` variable in `src/styles/tokens.css`. The change propagates to every component that uses it.

## Repository snapshot

Short: a Vite React frontend with Firebase (Firestore/Auth/Storage) and a TypeScript Firebase Functions backend (Twilio OTP). Frontend entry: `src/main.jsx` → `src/router.jsx` → `src/App.jsx`.

Keep these goals in mind when editing: preserve existing Firebase data shapes (see `useFirestore.js`), respect protected routes (`ProtectedRoute.jsx`), and prefer small, reversible frontend changes (vital for live site).

## Immediate workflows (commands)
- Install: `npm install`
- Dev frontend: `npm run dev` (Vite dev server)
- Build frontend: `npm run build`
- Preview build: `npm run preview`
- Tests: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Functions (in `functions/`): `npm --prefix functions run build`, `npm --prefix functions run serve` (emulator), `npm --prefix functions run deploy`

## Project-specific patterns and conventions
- Firebase config is centralized in `src/firebase.js` and reads Vite env vars (VITE_FIREBASE_*). Use `import.meta.env` for config access.
- Data access uses a small helper hook `src/hooks/useFirestore.js`. It expects collection names and an options object { where, orderBy, limit, realtime }. When changing document shapes, update usages across Components (search for `.data()` or field names).
- Protected admin UI is gated by `src/Components/ProtectedRoute.jsx` and Firebase Auth via `react-firebase-hooks`. Changes to auth behavior must update both `src/Components/AdminLogin.jsx` and `ProtectedRoute.jsx`.
- Routing is configured with React Router v6 in `src/router.jsx`. App layout (Navbar/Footer/Dark mode) lives in `src/App.jsx` and uses an Outlet for pages.
- Styles are local CSS files next to components (e.g., `Components/Navbar.css`). Prefer keeping CSS colocated for consistency.

## Integrations and external dependencies
- Firebase services in use: Firestore, Authentication, Storage. Server-side functions use `firebase-admin` and `firebase-functions`.
- Twilio is used for sending OTPs in `functions/src/index.ts`. Twilio keys are expected in environment variables (TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM_NUMBER) for the functions runtime.

## Editing guidance for AI agents
- When adding/renaming Firestore fields: update `useFirestore.js` consumers and any Cloud Function that reads/writes the same collections (see `functions/src/index.ts` for `quiz-otp-requests`).
- For UI edits, prefer modifying component-level CSS and minimal JS; large refactors should include a short migration note (e.g., changed article shape -> update ArticlePage, ArticleForm, useFirestore queries).
- Tests: follow existing Jest + Testing Library patterns. Look at `src/Components/__tests__` and `src/hooks/__tests__` for examples. Add one unit test per new behaviour and one integration test for cross-component flows (auth + ProtectedRoute).

## Files worth inspecting for context
- `src/firebase.js` — env var usage and helper exports (`db`, `auth`, `storage`, auth helpers)
- `src/hooks/useFirestore.js` — canonical Firestore access pattern (realtime option)
- `src/router.jsx` — routing and protected routes
- `src/Components/ProtectedRoute.jsx` — auth gating pattern
- `functions/src/index.ts` and `functions/package.json` — cloud functions build & deploy flow, Twilio usage
- `package.json` — top-level scripts (dev/build/test)
- `README.md` — general project overview and env var list (VITE_FIREBASE_*)

## Error handling & logging patterns
- Frontend: components use simple try/catch and `console.error`. ErrorBoundary (`src/Components/ErrorBoundary.jsx`) wraps the app; respect its props if adding recoverable UI.
- Functions: use `firebase-functions/logger` (see `functions/src/index.ts`). Preserve logging levels (`info`, `warn`, `error`) when adding instrumentation.

## Quick tips / gotchas
- Environment: Frontend expects Vite env vars prefixed with `VITE_`. Forgetting the prefix will make them unavailable in the client.
- Node engine: functions target Node 22 (see `functions/package.json`), ensure local emulation respects this where possible.
- Realtime queries: `useFirestore` supports `realtime: true` which sets up `onSnapshot`. Be cautious introducing extra realtime listeners.

If anything in this doc is unclear or you want additional rules (naming conventions, PR template, larger migration guidance), tell me what to expand and I will iterate.

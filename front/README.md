# MusConv · Relay

A responsive music-link converter with calm off-white backgrounds, white surfaces,
Azure actions, line icons, and motion that respects reduced-motion preferences.
Tracks can come from Spotify, Deezer, or YouTube Music; Spotify albums are also
supported. Results distinguish direct suggestions from service search links.

## Run locally

Use pnpm 9 and Node 20.19+ for Vite. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

Open `http://localhost:5173/spoty2deezer/`. Start the backend separately with
`npm ci && npm start` in `../back`; Vite forwards `/proxy` to port 3001.
Production builds require `VITE_PROXY_TARGET` to point to the deployed backend.

## UI structure

`src/components/relay/` contains the complete interface:

- `RelayApp.tsx`: form, independent destination outcomes, cancellation, language
  selection, help, clipboard feedback, and manual-copy recovery.
- `Results.tsx`: source, destination cards, alternatives, and recording details.
- `MediaCard.tsx`, `Dialog.tsx`, `Icon.tsx`: shared accessible presentation.
- `presentation.ts`: input capability checks and normalized track/album data.
- `copy.ts`: English and French copy; `relay.css`: tokens and responsive styling.

The existing conversion hooks and services supply real results. A failed
destination preserves the other service's results. Retries stay bound to the
displayed source; changing the field does not change what a retry searches.
“Stop waiting” ignores late responses; it does not abort transport requests.

## Verification

From this directory, using Node 24+ for its native TypeScript support:

```sh
node --experimental-strip-types --test tests/*.test.ts
pnpm build
pnpm --dir .. lint
```

The seven regression checks cover supported formats, search-link labeling,
track/album metadata, safe destinations, and Deezer outage versus empty-result
semantics. Lint passes with five existing warnings outside the new UI.

## UI/UX audit · 2026-10-18

The implementation was audited in Chromium with scripted interaction checks,
computed styles, screenshots, a live conversion, and independent code review.

| Area | Findings addressed and evidence |
| --- | --- |
| Visual hierarchy and contrast | Preserved the approved neutral/Azure palette. Strengthened text, control boundaries, and focus indicators. Checked home-screen text has a minimum contrast of 5.1:1; secondary-control boundaries exceed 3:1. Fixed a cascade issue that hid secondary-button borders. |
| Responsive layouts | No horizontal overflow at 320, 390, 640, 768, 1024, or 1440px in English and French. Repeated the interaction checks at 320px. |
| Conversion and recovery | Distinct empty, failure, search-link, and partial-result states. Added manual search links, retained cached results with retries, and bound retries to the displayed source URL. Deezer failures and YouTube metadata failures now propagate instead of becoming misleading empty or invented results. |
| Keyboard and announcements | Native modal focus containment/return, labeled inputs, errors, skip link, result-status announcements, and clipboard feedback. Removed redundant input focus outlines. Copy success is also shown inside an open detail dialog. |
| Copying and details | Separate Open/Search and Copy controls. Confirmation follows clipboard success; failure reveals the exact selectable URL. Recording details preserve album metadata and include actions. Fixed a stray zero in empty feedback. |
| Motion and icons | Consistent local SVG icons, hover/press feedback, result/dialog entrance transitions, and loading indication. A reduced-motion stylesheet removes movement. |
| Content and navigation | Accurate link guide, localized missing-artist label, EN/FR selector, new-link action, updated favicon and browser theme. Unsupported playlist/Deezer-album promises were removed. |

Twenty-five scripted browser checks passed using controlled service responses.
A separate live Spotify conversion returned a real Deezer track and a labeled
YouTube Music search link. External catalog availability still depends on those
services. This audit does not constitute certification with assistive technology
or a full cross-browser compatibility test.

Design explorations under the repository's `artifacts/` directory remain local
and are excluded from Git and linting.

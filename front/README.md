# MusConv · Relay

A responsive interface with neutral backgrounds, Azure actions, official platform marks, English/French copy, and reduced-motion support. Tracks and albums from Spotify, Deezer, and YouTube Music are supported; generic playlist transfers are not.

## Development

Use Node 24 and pnpm 9:

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm build
```

Open `http://localhost:5173/spoty2deezer/`. Start the backend with `npm ci && npm start` in `../back`. Vite forwards `/api` to port 3001. Production uses `VITE_API_URL` or the existing `VITE_PROXY_TARGET` alias.

## UI and data flow

- `RelayApp.tsx`: input, loading/cancellation, result retention, language, and clipboard recovery.
- `useResolver.ts`: one abortable request to `/api/resolve` for every direction.
- `resolutionContract.ts`: validates the backend response before it enters UI state.
- `Results.tsx`: explicit outcomes, alternatives, partial results, retries, and details.
- `EmbedPreview.tsx`: source players and a compact unavailable-player fallback.
- `MediaCard.tsx`, `Dialog.tsx`, and `Icon.tsx`: shared presentation.
- `presentation.ts`: shared input parser, embed URLs, and manual searches.
- `copy.ts` and `relay.css`: copy, tokens, and responsive styling.

Provider fetching, metadata parsing, and matching live on the backend. Cancelling or resetting aborts the browser request; the backend aborts work when no callers remain. Successful results stay visible during retries; retries use the displayed source URL even if the input has changed. Preview availability is independent of conversion results.

## Verification

From the repository root:

```sh
pnpm test
pnpm lint
pnpm build
```

The frontend checks parser/preview behavior and response validation. Backend tests cover conversion behavior through provider fixtures and loopback HTTP integration. Live provider checks and browser acceptance complement those deterministic tests. Credential-backed Spotify/YouTube branches are fixture-tested until credentials are configured.

The following UI audit records the original Relay redesign. The resolver migration preserves its presentation while replacing its former browser-side conversion hooks.

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

## Resolver migration verification · 2026-10-18

The migrated build passed 50 automated checks (47 backend, three frontend), production compilation, and lint with one pre-existing `main.tsx` warning. Ten browser acceptance checks passed at desktop width and 320px, including modal copy feedback, explicit statuses, result retention, retry binding after editing the field, actual fetch cancellation, late-response protection, empty-result recovery, partial-candidate retries, and reset. The narrow frame had no horizontal overflow.

Live public-provider checks passed for Spotify track/album, Deezer track/album, and YouTube Music track/album sources. They retained the expected artist and returned direct Deezer suggestions or clearly labelled destination searches. These checks used the local credential-free configuration; credential-backed branches use deterministic fixtures. Independent reviews identified redirect credential handling, rate-limit races, token cancellation, version distinctions, paginated albums, and duplicate track-title assignment; regression tests cover the fixes.

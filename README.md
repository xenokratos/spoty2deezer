# MusConv

Find a track or album on Spotify, Deezer, and YouTube Music. The interface distinguishes catalog suggestions from search links and keeps successful results when another provider fails.

## Development

Use Node 24 and pnpm 9. Install the root and frontend dependencies with pnpm, and backend dependencies with npm:

```sh
pnpm install --frozen-lockfile
pnpm --dir front install --frozen-lockfile
npm --prefix back ci
pnpm dev
```

Open `http://localhost:5173/spoty2deezer/`. Vite forwards `/api` to the Express backend on port 3001.

```sh
pnpm test
pnpm lint
pnpm build
```

Tests include loopback HTTP integration tests. Builds go to `front/dist/`.

## Conversion architecture

The browser sends one `POST /api/resolve` request. The backend canonicalizes the URL, fetches source metadata once, and queries the other two provider adapters concurrently. Matching prefers ISRC for recordings and UPC for albums, then compares artist, title, duration, version labels, and available album track lists.

The parser in `back/lib/music-link.mjs` is shared with frontend validation. The response types live in `back/lib/contract.d.ts`; the frontend validates responses before rendering them. Provider fetching and HTML parsing run exclusively on the backend.

Equivalent concurrent requests share work. Cancelling one caller does not cancel another; the last cancellation aborts upstream work. Complete successful results are cached in memory by canonical source and market for five minutes. Partial results and failures are not cached. The cache holds at most 200 entries; at most 32 distinct resolutions run concurrently. There is no database or background queue.

## Provider capabilities

| Provider | Source metadata | Destination matching |
| --- | --- | --- |
| Spotify | Public structured embed/oEmbed metadata | Labelled search link |
| Deezer | Public catalog API, including track/album and ISRC/UPC data | Identifier lookup followed by catalog search |
| YouTube Music | Public oEmbed for tracks; album-page metadata for `OLAK5uy_` albums | Labelled search link |

The app requires no developer accounts, API keys, or user sign-in. Public metadata lookups and Deezer catalog requests can still be rate-limited or become unavailable. HTML metadata may change independently of this app. ISRC equality is evidence of recording identity, not a guarantee of identical mastering or playback availability.

Track links and albums from all three services are supported. Generic playlist transfers are not implemented. Previews are independent of matching; unavailable YouTube embeds show a compact fallback link.

## Configuration and deployment

See [backend configuration](back/README.md) and [frontend documentation](front/README.md). Copy `back/.env.example` to `back/.env` to customize server settings.

Production frontend builds accept `VITE_API_URL`; the existing `VITE_PROXY_TARGET` variable remains a compatibility alias. `render.yaml` deploys the backend from `back/` using Node 24 and `npm ci`.

The resolver replaces the old `/proxy` endpoint. Deploy the backend and frontend together, or enable the temporary legacy endpoint during a staged rollout as described in the backend README. Local design previews under `artifacts/` remain excluded from Git.

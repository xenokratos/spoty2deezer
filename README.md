> [!NOTE]
> 🚧 This project is a work in progress.

# 🎵 MusConv — Music Link Converter

Find a track or album on **Spotify**, **Deezer**, and **YouTube Music**. Paste a link, check the results, then open or copy the destination link.

**No accounts, API keys, or sign-in required.**

## ✨ Features

- 🎵 **Three platforms** — Track and album links from Spotify, Deezer, and YouTube Music.
- 🔍 **Catalog matching** — Deezer suggestions use recording/release identifiers and metadata when available.
- 🔗 **Clear search links** — Spotify and YouTube Music destinations open a search for the track or album.
- 🎧 **Embedded previews** — Listen through the source platform, with a direct link when playback is unavailable.
- 📋 **Copy and share** — Copy destination links, with manual-copy recovery when needed.
- 🌐 **English and French** — Responsive layouts, keyboard navigation, and reduced-motion support.
- ⏱️ **Cancellation and retries** — Cancel a search, retry a failed service, and keep successful results.

## 🚀 Quick Start

### Prerequisites

- **Node.js 24**
- **pnpm 9** and npm

### Installation & Development

```sh
# Install dependencies
pnpm install --frozen-lockfile
pnpm --dir front install --frozen-lockfile
npm --prefix back ci

# Start frontend and backend
pnpm dev
```

Open **[localhost:5173/spoty2deezer](http://localhost:5173/spoty2deezer/)**.

To run the servers separately:

```sh
pnpm dev:front  # Frontend: localhost:5173
pnpm dev:back   # Backend: localhost:3001
```

## 📋 Usage

1. **Paste a link** to a track or album.
2. **Search the other services.** The source is identified automatically.
3. **Check the result**, including the artist and recording version.
4. **Open or copy** the destination link.

### Supported Links

| Platform | Tracks | Albums |
| --- | --- | --- |
| Spotify | `open.spotify.com/track/…` · `spotify:track:…` | `open.spotify.com/album/…` · `spotify:album:…` |
| Deezer | `deezer.com/track/…` · `link.deezer.com/s/…` | `deezer.com/album/…` |
| YouTube Music | `music.youtube.com/watch?v=…` · YouTube watch/short links | `music.youtube.com/playlist?list=OLAK5uy_…` |

Tracking parameters and supported locale paths are handled automatically. Generic playlist transfers are not supported.

## 🏗️ Architecture

### Backend · Express

One **`POST /api/resolve`** request handles every conversion direction:

1. Validate and canonicalize the source link.
2. Fetch source metadata once.
3. Query the two destination adapters concurrently.
4. Return catalog suggestions, search links, or an explicit failure state.

Matching prefers **ISRC** for recordings and **UPC** for albums, then compares artist, title, duration, version labels, and available album track lists. Matching scores rank candidates; they are not probabilities.

### Frontend · React + TypeScript

- **React 19** and **TypeScript** for the interface.
- **Vite** for development and production builds.
- **CSS tokens** for the neutral/Azure theme and responsive layouts.
- **One resolver hook** for requests, cancellation, and response validation.
- **Biome** for formatting and linting.

### Provider Capabilities

| Provider | Source metadata | Destination result |
| --- | --- | --- |
| Spotify | Public embed/oEmbed metadata | Labelled search link |
| Deezer | Public catalog API | Identifier or metadata-based suggestions |
| YouTube Music | Public oEmbed and album-page metadata | Labelled search link |

Public provider responses can change, be rate-limited, or become unavailable. Preview playback is separate from matching; an unavailable player does not erase conversion results.

## ⚙️ Configuration

Local development works with the defaults. To customize the backend, copy [`back/.env.example`](back/.env.example) to `back/.env`.

| Setting | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Backend port |
| `DEFAULT_MARKET` | `FR` | Requested catalog market and cache identity |
| `RESOLVER_CACHE_TTL_MS` | `300000` | In-memory cache lifetime; `0` disables caching |
| `CORS_ORIGIN` | Any origin | Allowed frontend origins |

For production frontend builds, set **`VITE_API_URL`** to the backend URL. The existing `VITE_PROXY_TARGET` variable remains a compatibility alias. In development, Vite forwards `/api` to port 3001.

See the [backend guide](back/README.md) for all server settings and the [frontend guide](front/README.md) for UI structure and audit results.

## 📡 API

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Server health |
| `GET /api/capabilities` | Supported provider operations |
| `POST /api/resolve` | Resolve a track or album link |

```sh
curl http://localhost:3001/api/resolve \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://open.spotify.com/track/1WvvmEowf7hiz5EnyAwtTj"}'
```

Results distinguish **identifier matches**, **likely matches**, **search links**, **no matches**, and **unavailable providers**. See the [response contract](back/lib/contract.d.ts).

## 🛠️ Development & Verification

| Command | Action |
| --- | --- |
| `pnpm dev` | Start both development servers |
| `pnpm test` | Run backend and frontend regression tests |
| `pnpm lint` | Check formatting and lint rules |
| `pnpm build` | Build the frontend into `front/dist/` |

Tests cover URL parsing, missing metadata, recording versions, album matching, provider failures, caching, cancellation, and HTTP integration. Browser acceptance checks cover conversion, copying, retries, recovery, and narrow layouts.

### Project Structure

```text
spoty2deezer/
├── back/
│   ├── lib/             # Shared URL parser and response contract
│   ├── resolver/        # Provider adapters, matching, cache, transport
│   ├── tests/           # Fixture and HTTP integration tests
│   └── server.js        # Express endpoints
├── front/
│   ├── src/
│   │   ├── components/  # Relay interface and players
│   │   ├── hooks/       # Resolver request lifecycle
│   │   └── utils/       # Response validation
│   └── tests/           # Frontend regression checks
├── render.yaml          # Backend deployment
├── biome.json           # Formatting and linting
└── package.json         # Development and verification commands
```

## 🔒 Reliability

- **Validated requests** — Fixed provider hosts and validation of every redirect.
- **Shared work** — Equivalent requests share one resolution; each caller can cancel independently.
- **Bounded caching** — Up to 200 complete results, keyed by source and market, with a five-minute default lifetime.
- **Failure isolation** — Partial results and failures are not cached; successful destinations stay usable.
- **Request limits** — Timeouts, bounded concurrency, transient retries, and provider rate-limit cooldowns.
- **No persistent data store** — In-memory state is cleared on server restart.

## 🚢 Deployment

1. Deploy the backend using [`render.yaml`](render.yaml): Node 24, `npm ci`, and the `/health` check.
2. Set `VITE_API_URL` and build the frontend with `pnpm build`.
3. Serve `front/dist/` from your static host.

Deploy frontend and backend together, or use the temporary legacy-route option described in the [migration guide](back/README.md#migration). The new frontend uses `/api/resolve`; the old `/proxy` route is disabled by default.

Local design explorations under `artifacts/` are excluded from Git.

## 🤝 Contributing

1. Create a branch for the change.
2. Run `pnpm test`, `pnpm lint`, and `pnpm build`.
3. Commit with a descriptive message and a Gitmoji, such as `fix(🐛): Fix album link parsing` or `docs(📝): Update setup instructions`.
4. Open a pull request.

## 📄 License

MIT — see the package manifests.

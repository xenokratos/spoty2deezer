# Music Link Resolver

Express backend for resolving music links across Spotify, Deezer, and YouTube Music.

```sh
npm ci
npm start
npm test
```

Node 20.18.1+ is required by the parser; Node 24 is the tested deployment target.

## API

`GET /health` reports server health. `GET /api/capabilities` reports the keyless capabilities: public metadata for all three platforms, direct Deezer catalog matching, and search links for Spotify and YouTube Music. It does not certify current provider availability.

`POST /api/resolve` accepts:

```json
{"url":"https://open.spotify.com/track/1WvvmEowf7hiz5EnyAwtTj","market":"FR"}
```

`market` is optional and defaults to `DEFAULT_MARKET` (`FR`). The response contains `schemaVersion: 1`, source metadata, source platform, market, and two destination outcomes. See `lib/contract.d.ts` for the response contract.

Destination statuses:

- `identifier_match`: matching recording/release identifier without conflicting metadata.
- `likely_match`: candidates ranked using metadata; the user should check the version.
- `search_link`: a service search URL, not a verified catalog match.
- `no_match`: the provider returned successfully but no suitable candidates remained.
- `provider_unavailable`: a request failed; other destinations remain usable.

A `partial` destination retains checked candidates when others could not be fetched and offers retry. No partial or failed resolution is cached. Source lookup failures return an error response rather than fabricated metadata. Invalid inputs return 400; upstream source failures generally return 502. Errors expose stable codes and optional `retryAfterMs`, not upstream response bodies or credentials.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | HTTP listen port |
| `DEFAULT_MARKET` | `FR` | Catalog market; included in cache identity |
| `RESOLVER_CACHE_TTL_MS` | `300000` | Public metadata/result cache TTL; zero disables caching, capped at one hour |
| `CORS_ORIGIN` | Any origin | Comma-separated frontend origins; `*` allows any origin |
| `METADATA_USER_AGENT` | `curl/8.7.1` | Public YouTube Music album-page lookup only; interactive user agents may redirect to consent |
| `ENABLE_LEGACY_PROXY` | `false` | Temporary compatibility for an older deployed frontend |

No developer account, API key, or authentication setup is required. Spotify sources use structured public embed data and then oEmbed. YouTube tracks use public oEmbed; YouTube albums use public page metadata. Spotify and YouTube Music destinations are labelled search links. Deezer provides direct catalog suggestions through its public endpoints.

## Reliability and matching

- Each provider has one adapter for source lookup and destination search.
- Source metadata is resolved once per shared resolution, not once per destination.
- The 20-second resolution deadline bounds waiting; HTTP requests have eight-second timeouts and one retry for transient failures. Rate limits fail fast and preserve the full `Retry-After` cooldown.
- Every redirect is validated, including credential sensitivity across the entire chain. Album pagination is limited to the expected provider album-track endpoint and ten extra pages.
- Matching scores rank candidates; they are not probabilities. Matching preserves version distinctions, penalizes conflicting identifiers, compares recording durations in milliseconds, and checks available album track identities. Incomplete track lists do not count as proof of a different release.
- Preview playback is handled independently by the frontend. A player error does not erase conversion results.
- In-memory state is process-local and bounded; it is lost on restart. There is no persistent user-data store.
- Structured logs report request IDs, provider, outcome/error code, count, and elapsed time. They omit pasted URLs, music metadata, tokens, and keys.

## Migration

Deploy backend and frontend together when possible. For a staged rollout, temporarily set `ENABLE_LEGACY_PROXY=true`, deploy the resolver backend, deploy the new frontend, then turn the flag off after older clients have been refreshed. The compatibility route uses the same validated transport and never accesses server credentials. The legacy route is disabled by default; the new frontend never calls it.

The old `ALLOWED_DOMAINS`, `ALLOWLIST`, `REQUEST_TIMEOUT`, and `MAX_REDIRECTS` settings no longer control the resolver. Fixed provider adapters own their outbound URLs.

## Tests

Run `npm test`. Fixture and integration checks cover canonical URLs, missing metadata, matching ambiguity, identifier conflicts, remaster years, album pagination, rate limits, redirect credentials, provider isolation, cache expiry, concurrent callers, cancellation, and HTTP disconnects. They require no accounts, keys, or external network access.

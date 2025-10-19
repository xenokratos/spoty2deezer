# Music Converter Backend Proxy

A secure, self-hosted CORS proxy server for the Music Converter application.

## Features

- 🚀 **CORS Proxy** - Handles requests to Spotify and Deezer APIs
- 🛡️ **Security** - Domain validation to prevent abuse
- ⚡ **Performance** - Direct proxy without unnecessary hops
- 📊 **Health Monitoring** - Built-in health check endpoint
- 🔧 **Error Handling** - Comprehensive error responses

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs on http://localhost:3001
```

### API Endpoints

- `GET /health` - Health check
- `GET /proxy?url=<encoded-url>` - Main proxy endpoint

### Example Usage

```bash
# Health check
curl http://localhost:3001/health

# Proxy a Spotify oEmbed request
curl "http://localhost:3001/proxy?url=https://open.spotify.com/oembed?url=https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"

# Proxy a Deezer search request
curl "http://localhost:3001/proxy?url=https://api.deezer.com/search?q=Caruso"
```

## Security Features

- **Domain Validation** - Only allows requests to music service domains
- **URL Validation** - Validates URL format before proxying
- **Request Logging** - Logs all proxy requests for monitoring
- **Error Handling** - Proper error responses for debugging

## Allowed Domains

The proxy only accepts requests to these domains:
- `open.spotify.com`
- `api.spotify.com`
- `oembed.spotify.com`
- `api.deezer.com`
- `link.deezer.com`
- `www.deezer.com`

## Deployment

### Railway
1. Connect your GitHub repository
2. Deploy automatically on push
3. Free tier available for small projects

### Render
1. Connect to GitHub repo
2. Deploy with free web service tier
3. Automatic deployments on push

### Heroku
1. Create a new app
2. Deploy via GitHub integration
3. Uses `package.json` scripts

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `ALLOWED_DOMAINS` | `open.spotify.com,api.spotify.com,oembed.spotify.com,api.deezer.com,link.deezer.com,www.deezer.com` | Comma-separated list of allowed domains |
| `REQUEST_TIMEOUT` | `15000` | Request timeout in milliseconds |
| `MAX_REDIRECTS` | `5` | Maximum number of redirects to follow |
| `USER_AGENT` | `MusicConverter-Backend/1.0` | User-Agent header for requests |

## Integration with Frontend

Update your frontend `responseWrapper.ts`:

```typescript
export function createProxyUrl(url: string): string {
  if (import.meta.env.MODE === 'development') {
    return `/proxy?url=${encodeURIComponent(url)}`;
  }
  // Use your deployed backend proxy
  return `https://your-backend-url.com/proxy?url=${encodeURIComponent(url)}`;
}
```

## Monitoring

- **Health Check**: `GET /health`
- **Request Logging**: Console logs for all proxy requests
- **Error Tracking**: Detailed error responses

## Security Notes

- ✅ **Your data stays private** - No third-party proxy services
- ✅ **Controlled access** - Domain validation prevents abuse
- ✅ **Request monitoring** - Full visibility into API usage
- ⚠️ **Rate limiting** - Consider implementing for production


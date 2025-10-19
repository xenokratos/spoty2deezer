> [!NOTE]
> 🚧 This project is a work in progress 🚧

# 🎵 MusConv - Universal Music Platform Converter

Convert music links between Spotify, Deezer, and YouTube Music effortlessly. A full-stack web application with a secure backend proxy and modern React frontend.

## ✨ Features

- 🎵 **Multi-platform support** - Convert between Spotify, Deezer, and YouTube Music
- 🔍 **Smart matching** - Uses advanced string similarity algorithms for accurate track matching
- 🌐 **Web-based** - No installation required, works in any modern browser
- ⚡ **Fast & responsive** - Built with Vite and optimized for performance
- 🛡️ **Secure proxy** - Backend validates all external API requests
- 📋 **One-click copying** - Copy converted links to clipboard instantly
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🔗 **Direct streaming** - Open tracks directly in your preferred music platform

## 🏗️ Architecture

### Backend (`/back`)
- **Express.js** server with CORS proxy functionality
- **Domain validation** - Only allows requests to music service APIs
- **Request forwarding** - Secure proxy to Spotify, Deezer, and YouTube Music APIs
- **Health monitoring** - Built-in health check endpoint

### Frontend (`/front`)
- **React 19** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, modern styling
- **Biome** for linting and formatting

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and **pnpm**
- Modern web browser

### Installation & Development

```bash
# Clone the repository
git clone <your-repo-url>
cd spoty2deezer

# Install all dependencies
pnpm run install:all

# Start development servers (frontend + backend)
pnpm run dev

# Or run individually:
pnpm run dev:front  # Frontend on http://localhost:5173
pnpm run dev:back   # Backend on http://localhost:3001
```

Visit `http://localhost:5173/spoty2deezer/` to use the application!

## 📋 Usage

1. **Paste a Spotify URL** - Enter any Spotify track URL
2. **Get matches** - The app finds the best Deezer/YouTube Music equivalents
3. **Choose your platform** - Click to copy links or open directly
4. **Enjoy your music** - Stream on your preferred platform

### Supported URL Formats

- `https://open.spotify.com/track/{track-id}`
- `spotify:track:{track-id}`
- `https://music.youtube.com/watch?v={video-id}`
- `https://deezer.com/track/{track-id}`

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `/back` directory:

```bash
# Server Configuration
PORT=3001

# Security Configuration
ALLOWED_DOMAINS=open.spotify.com,api.spotify.com,oembed.spotify.com,api.deezer.com,link.deezer.com,www.deezer.com

# Request Configuration
REQUEST_TIMEOUT=15000
MAX_REDIRECTS=5
USER_AGENT=MusicConverter-Backend/1.0
```

### Frontend Environment Variables

Create a `.env` file in the `/front` directory:

```bash
# Development Server Configuration
VITE_DEV_PORT=5173

# Backend Proxy Configuration
VITE_PROXY_TARGET=https://spoty2deezer.onrender.com

# Application Configuration
VITE_BASE_PATH=/spoty2deezer/
```

For local development, create a `.env.local` file to override with localhost URLs:

```bash
# Local Development Environment Variables
VITE_DEV_PORT=5173
VITE_PROXY_TARGET=http://localhost:3001
VITE_BASE_PATH=/spoty2deezer/
```

## 📡 API Documentation

### Backend Endpoints

#### Health Check
```http
GET /health
```
Returns server status and timestamp.

#### Proxy Endpoint
```http
GET /proxy?url=<encoded-url>
```
Proxies requests to music service APIs with domain validation.

**Example:**
```bash
curl "http://localhost:3001/proxy?url=https://open.spotify.com/oembed?url=https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh"
```

### Frontend API Integration

The frontend automatically proxies API requests through the backend. No additional configuration needed for development.

## 🚢 Deployment

### Production Build

```bash
# Build the frontend
pnpm run build

# The built files will be in front/dist/
```

### Render Deployment

The project includes `render.yaml` for easy deployment on Render:

1. Connect your GitHub repository to Render
2. Deploy the backend service (configured in `render.yaml`)
3. Serve the built frontend files statically or through a CDN

### Environment Variables for Production

Set these environment variables in your deployment platform:

**Backend:**
- `PORT` - Server port (provided by Render)
- `ALLOWED_DOMAINS` - Comma-separated list of allowed domains
- `NODE_ENV` - Set to `production`

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm run dev              # Start both frontend and backend
pnpm run dev:front        # Frontend only
pnpm run dev:back         # Backend only

# Building
pnpm run build            # Build frontend for production

# Maintenance
pnpm run install:all      # Install all dependencies
pnpm run clean            # Clean all node_modules and build files
pnpm run lint             # Check code with Biome
pnpm run lint:fix         # Auto-fix linting issues
pnpm run format           # Format code
```

### Project Structure

```
spoty2deezer/
├── back/                 # Express.js backend
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── README.md        # Backend documentation
├── front/               # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── services/    # API service functions
│   │   └── utils/       # Utility functions
│   ├── package.json     # Frontend dependencies
│   └── README.md        # Frontend documentation
├── render.yaml          # Render deployment config
├── biome.json          # Code formatting config
└── package.json        # Root package management
```

## 🔒 Security

- **Domain Validation** - Backend only allows requests to whitelisted music service domains
- **Request Validation** - All URLs are validated before proxying
- **CORS Protection** - Configurable CORS policies
- **No Data Storage** - No user data or music content is stored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and run tests: `pnpm run lint:fix`
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature`
6. Open a Pull Request

### Code Style

- **Formatting**: Biome (configured in `biome.json`)
- **TypeScript**: Strict type checking enabled
- **Imports**: ES6 modules with absolute paths where possible

## 📄 License

MIT License - see individual package.json files for details.

## 🙏 Acknowledgments

- Built with ❤️ for music lovers who want platform freedom
- Inspired by the frustration of maintaining multiple music libraries
- Thanks to Spotify, Deezer, and YouTube Music for their APIs

---

**Made with ❤️ for music lovers everywhere**

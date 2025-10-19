# Spotify to Deezer Converter

Convert Spotify track links to equivalent Deezer links, or YouTube Music links effortlessly. Built with React, Vite, and Tailwind CSS.

## Features

- 🎵 Convert Spotify track URLs to Deezer links
- 🔍 Find up to 5 closest matches on Deezer
- 🌐 Web-based application
- 🎨 Modern UI with responsive design
- ⚡ Fast and accurate matching using Levenshtein distance
- 📋 Copy links to clipboard
- 🔗 Open tracks directly in Deezer

## Tech Stack

- **React** - Modern web framework for building user interfaces
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Biome** - Fast linter and formatter

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Available Scripts

- `pnpm dev` - Start Vite development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run Biome linter
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with Biome

### Environment Variables

Create a `.env` file in the root of the frontend directory:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_PROXY_TARGET` | `http://localhost:3001` | Backend proxy URL for development |

Example `.env` file:

```bash
# Backend Proxy Configuration
VITE_PROXY_TARGET=http://localhost:3001
```

## Supported URL Formats

- `https://open.spotify.com/track/{track-id}`
- `spotify:track:{track-id}`

## How It Works

1. Paste a Spotify track URL
2. The app fetches track information from Spotify's oEmbed API
3. It searches Deezer's API for matching tracks
4. Uses string similarity algorithms to find the best matches
5. Displays results with album art and track details

## Project Structure

```
spoty2deezer/
├── src/
│   ├── components/
│   │   ├── common/               # Reusable UI components
│   │   ├── link-converter/       # Main converter functionality
│   │   └── ...
│   ├── hooks/                    # Custom React hooks
│   ├── services/                 # API services
│   │   ├── spotifyService.ts     # Spotify API integration
│   │   ├── deezerService.ts      # Deezer API integration
│   │   └── youtubeMusicService.ts # YouTube Music API integration
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   └── ...
├── index.html                    # HTML entry point
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies
```

## API Usage

### Spotify
- Uses Spotify's oEmbed API (no authentication required)
- Fetches basic track information

### Deezer
- Uses Deezer's public search API via JSONP
- No authentication required

### YouTube Music
- Integrates with YouTube Music for additional matching options

## Development

### Adding New Features

The codebase uses standard React patterns:

```tsx
import React, { useState } from 'react';

function ExampleComponent() {
  const [state, setState] = useState('');

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h1 className="text-xl font-bold text-gray-900">
        Hello World
      </h1>
    </div>
  );
}
```

### Styling

Uses Tailwind CSS for styling:

```tsx
<div className="flex-1 bg-white p-4 rounded-lg shadow-lg">
  <h1 className="text-xl font-bold text-gray-900">
    Hello World
  </h1>
</div>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `pnpm lint:fix` and `pnpm format`
5. Submit a pull request

## License

MIT

## Acknowledgments

- Made with ❤️ for music lovers
- Inspired by the need to convert playlists between streaming services

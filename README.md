# Spotify to Deezer Converter

A React + Vite application that converts Spotify track links to equivalent Deezer track links.

## Features

- ✅ Parse various Spotify URL formats
- ✅ Fetch track metadata from Spotify API  
- ✅ Search for matching tracks on Deezer
- ✅ Smart matching algorithm using artist, title, and album info
- ✅ Clean, responsive UI
- ✅ Copy Deezer links to clipboard

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Fill in your Spotify credentials:

```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
```

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Usage

1. Copy a Spotify track URL (e.g., from the Spotify app or web player)
2. Paste it into the input field
3. Click "Convert" 
4. Get the equivalent Deezer link!

### Supported URL Formats

- `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh`
- `https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=...`
- `spotify:track:4iV5W9uYEdYUVa79Axb7Rh`

## How It Works

1. **URL Parsing**: Extracts the Spotify track ID from various URL formats
2. **Spotify API**: Fetches detailed track metadata (artist, title, album, etc.)
3. **Deezer Search**: Searches Deezer's API using multiple query strategies
4. **Smart Matching**: Uses a scoring algorithm to find the best match based on:
   - Artist name similarity
   - Track title similarity  
   - Album name (when available)
   - Duration matching (when available)

## Technologies Used

- React 18
- Vite
- Axios (for API calls)
- Spotify Web API
- Deezer API

## API Information

- **Spotify API**: Uses Client Credentials flow for authentication
- **Deezer API**: No authentication required for search operations

## Build

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

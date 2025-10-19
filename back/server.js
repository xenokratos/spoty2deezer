require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Allowed domains for security validation (configurable via ALLOWED_DOMAINS env var)
const allowedDomains = process.env.ALLOWED_DOMAINS
	? process.env.ALLOWED_DOMAINS.split(',').map((domain) =>
			domain.trim().toLowerCase(),
		)
	: [
			'open.spotify.com',
			'api.spotify.com',
			'oembed.spotify.com',
			'api.deezer.com',
			'link.deezer.com',
			'www.deezer.com',
		];

// Middleware
app.use(
	cors({
		origin: true, // Allow all origins for development
		credentials: true,
	}),
);
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
	res.json({
		status: 'OK',
		timestamp: new Date().toISOString(),
		service: 'Music Converter Backend Proxy',
	});
});

// Main proxy endpoint - handles all external API requests
app.get('/proxy', async (req, res) => {
	try {
		const { url } = req.query;

		if (!url) {
			return res.status(400).json({
				error: 'URL parameter is required',
				usage: '/proxy?url=<encoded-url>',
			});
		}

		// Validate URL to prevent abuse (domains defined at module level)

		try {
			const urlObj = new URL(url);
			const isAllowed = allowedDomains.some(
				(domain) =>
					urlObj.hostname.toLowerCase() === domain ||
					urlObj.hostname.toLowerCase().endsWith(`.${domain}`),
			);

			if (!isAllowed) {
				return res.status(403).json({
					error: 'Domain not allowed',
					message: 'Only music service domains are permitted',
				});
			}
		} catch (_error) {
			return res.status(400).json({
				error: 'Invalid URL format',
				message: 'Please provide a valid URL',
			});
		}

		console.log(`🔄 Proxying request to: ${url}`);

		// Make the request to the target URL
		const response = await axios.get(url, {
			timeout: parseInt(process.env.REQUEST_TIMEOUT, 10) || 15000, // Configurable timeout (default 15 seconds)
			maxRedirects: parseInt(process.env.MAX_REDIRECTS, 10) || 5,
			headers: {
				'User-Agent': process.env.USER_AGENT || 'MusicConverter-Backend/1.0',
				Accept: 'application/json, text/html, */*',
				'Cache-Control': 'no-cache',
			},
			validateStatus: (status) => status >= 200 && status < 400,
		});

		// Log successful request
		console.log(`✅ Proxy success: ${response.status} for ${url}`);

		// Set appropriate headers for the response
		res.set({
			'Content-Type': response.headers['content-type'] || 'application/json',
			'Cache-Control': 'no-cache',
			'X-Proxy-Service': 'MusicConverter-Backend',
		});

		// Send the response data
		res.status(response.status).send(response.data);
	} catch (error) {
		console.error('❌ Proxy error:', error.message);

		if (error.response) {
			// Forward the error status from the target
			res.status(error.response.status).json({
				error: 'Target server error',
				status: error.response.status,
				message: error.message,
				proxy: 'MusicConverter-Backend',
			});
		} else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
			res.status(408).json({
				error: 'Request timeout',
				message: 'The target server took too long to respond',
				proxy: 'MusicConverter-Backend',
			});
		} else if (error.code === 'ENOTFOUND') {
			res.status(404).json({
				error: 'Domain not found',
				message: 'The requested domain could not be resolved',
				proxy: 'MusicConverter-Backend',
			});
		} else {
			res.status(500).json({
				error: 'Proxy server error',
				message: error.message,
				proxy: 'MusicConverter-Backend',
			});
		}
	}
});

// Catch-all handler for undefined routes
app.use('*', (_req, res) => {
	res.status(404).json({
		error: 'Endpoint not found',
		message: 'Use /proxy?url=<encoded-url> for API requests',
		usage: '/proxy?url=https://api.deezer.com/search?q=track',
	});
});

// Start the server
app.listen(PORT, () => {
	console.log(
		`🚀 Music Converter Backend Proxy Server running on port ${PORT}`,
	);
	console.log(`📡 Health check: http://localhost:${PORT}/health`);
	console.log(
		`🔗 Proxy endpoint: http://localhost:${PORT}/proxy?url=<encoded-url>`,
	);
	console.log(`🛡️ Allowed domains: ${allowedDomains.join(', ')}`);
});

module.exports = app;

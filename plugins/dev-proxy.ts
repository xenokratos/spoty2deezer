import type { Plugin } from 'vite';
import axios from 'axios';

/**
 * /proxy?url=<absolute URL>
 * - Follows redirects on the server (axios does this by default).
 * - Streams the final body back to the browser.
 * - Copies most headers except content-encoding.
 */
export default function devProxy(): Plugin {
	return {
		name: 'dev-proxy-axios',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/proxy', async (req: Request, res) => {
				try {
					const u = new URL(req.url || '', 'http://localhost');
					const target = u.searchParams.get('url');
					if (!target) {
						res.statusCode = 400;
						res.end('Missing ?url= param');
						return;
					}

					// For JSON responses (like APIs), use text responseType to get full data
					// For binary/large responses, we could use 'stream'
					const upstream = await axios.get(target, {
						responseType: 'text', // Use 'text' instead of 'stream' to get full JSON data
						timeout: 30000, // 30 second timeout for large responses
						maxContentLength: Infinity, // Allow large responses
						maxBodyLength: Infinity, // Allow large response bodies
						// Optional: forward some headers if needed (cookie, ua, etc.)
						headers: {
							'User-Agent': 'Mozilla/5.0 (compatible; MusicConverter/1.0)',
							Accept: 'application/json, text/plain, */*',
						},
						// Follow redirects: default true in axios (Node)
						maxRedirects: 5,
						validateStatus: () => true, // pass through non-2xx
					});

					res.statusCode = upstream.status;

					// copy headers except content-encoding (can confuse dev server)
					Object.entries(upstream.headers).forEach(([k, v]) => {
						if (k.toLowerCase() !== 'content-encoding') {
							if (Array.isArray(v)) res.setHeader(k, v);
							else if (v != null) res.setHeader(k, String(v));
						}
					});

					// allow your dev origin (detect from request)
					// @ts-expect-error - headers is not typed
					const origin = req.headers.origin || req.headers.referer || '';
					if (
						origin &&
						(origin.includes('localhost:517') ||
							origin.includes('127.0.0.1:517'))
					) {
						res.setHeader('Access-Control-Allow-Origin', origin);
					} else {
						res.setHeader('Access-Control-Allow-Origin', '*');
					}
					res.setHeader('Access-Control-Expose-Headers', 'X-Final-Url');

					// send the response body
					// For text responses (JSON APIs), send the full data
					if (upstream.data) {
						const dataLength =
							typeof upstream.data === 'string'
								? upstream.data.length
								: upstream.data.byteLength;
						console.log(
							`Proxy: Sending response with ${dataLength} characters/bytes`,
						);

						// Ensure content-type is set for JSON responses
						if (
							!res.getHeader('content-type') &&
							upstream.headers['content-type']
						) {
							res.setHeader('content-type', upstream.headers['content-type']);
						}

						// Set content-length header
						res.setHeader('Content-Length', dataLength);

						res.end(upstream.data);
					} else {
						console.log('Proxy: No data to send');
						res.end();
					}
				} catch (err: any) {
					res.statusCode = 502;
					res.end(`Proxy error: ${err?.message || err}`);
				}
			});
		},
	};
}

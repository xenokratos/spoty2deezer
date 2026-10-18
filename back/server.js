require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');

async function createApp({
	resolver,
	logger = console.info,
	legacyProxy = process.env.ENABLE_LEGACY_PROXY === 'true',
	legacyHttp,
} = {}) {
	const { createResolver } = await import('./resolver/index.mjs');
	const { publicError } = await import('./resolver/errors.mjs');
	const engine = resolver ?? createResolver({ logger });
	const app = express();
	const origins = process.env.CORS_ORIGIN;
	app.use(
		cors({
			origin:
				!origins || origins === '*'
					? true
					: origins.split(',').map((s) => s.trim()),
		}),
	);
	app.use(express.json({ limit: '8kb' }));
	app.get('/health', (_req, res) =>
		res.json({ status: 'OK', service: 'Music Link Resolver' }),
	);
	app.get('/api/capabilities', (_req, res) =>
		res.json({ schemaVersion: 1, providers: engine.capabilities }),
	);
	if (legacyProxy) {
		const { createHttp } = await import('./resolver/http.mjs');
		const transport = legacyHttp ?? createHttp();
		const legacyHosts = new Set([
			'open.spotify.com',
			'api.deezer.com',
			'link.deezer.com',
			'www.deezer.com',
			'deezer.com',
			'www.youtube.com',
			'music.youtube.com',
			'youtube.com',
		]);
		app.get('/proxy', async (req, res) => {
			const controller = new AbortController();
			const abort = () => {
				if (!res.writableEnded) controller.abort();
			};
			res.once('close', abort);
			res.set({ Deprecation: 'true', 'Cache-Control': 'no-store' });
			try {
				if (typeof req.query.url !== 'string' || req.query.url.length > 4096)
					return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
				const url = new URL(req.query.url);
				if (
					!legacyHosts.has(url.hostname) ||
					[...url.searchParams.keys()].some((key) =>
						/^(?:key|access_token|client_secret)$/i.test(key),
					)
				)
					return res.status(400).json({ error: { code: 'INVALID_INPUT' } });
				const data = await transport.get(url.href, {
					signal: controller.signal,
				});
				if (!controller.signal.aborted) res.send(data);
			} catch (error) {
				if (!controller.signal.aborted && !res.destroyed)
					res.status(502).json({ error: publicError(error) });
			} finally {
				res.off('close', abort);
			}
		});
	}
	app.post('/api/resolve', async (req, res) => {
		const controller = new AbortController();
		const abort = () => {
			if (!res.writableEnded)
				controller.abort(new DOMException('Client disconnected', 'AbortError'));
		};
		req.once('aborted', abort);
		res.once('close', abort);
		res.set('Cache-Control', 'no-store');
		try {
			const result = await engine.resolve(
				{
					url: req.body?.url,
					market: req.body?.market ?? process.env.DEFAULT_MARKET ?? 'FR',
				},
				{ signal: controller.signal },
			);
			if (!controller.signal.aborted) res.json(result);
		} catch (error) {
			if (controller.signal.aborted || res.destroyed) return;
			const issue = publicError(error);
			if (issue.retryAfterMs)
				res.set('Retry-After', String(Math.ceil(issue.retryAfterMs / 1000)));
			res.status(error.status ?? 502).json({ error: issue });
		} finally {
			req.off('aborted', abort);
			res.off('close', abort);
		}
	});
	app.use((_req, res) =>
		res.status(404).json({ error: { code: 'NOT_FOUND' } }),
	);
	app.use((error, _req, res, _next) => {
		res
			.status(error.status === 413 ? 413 : 400)
			.json({ error: { code: 'INVALID_INPUT' } });
	});
	return app;
}
if (require.main === module) {
	createApp()
		.then((app) => {
			const port = process.env.PORT || 3001;
			app.listen(port, () =>
				console.info(`Music Link Resolver listening on ${port}`),
			);
		})
		.catch(() => {
			console.error('Unable to start Music Link Resolver');
			process.exitCode = 1;
		});
}
module.exports = { createApp };

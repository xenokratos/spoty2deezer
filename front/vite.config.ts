import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [react()],
	server: {
		port: Number(process.env.VITE_DEV_PORT),
		host: true,
		proxy: {
			// Dev-only: front → backend proxy
			'/proxy': {
				target: process.env.VITE_PROXY_TARGET,
				changeOrigin: true,
				secure: false,
			},
		},
	},
	base: process.env.VITE_BASE_PATH,
	build: {
		chunkSizeWarningLimit: 1000,
	},
});

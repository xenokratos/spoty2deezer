import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import devProxy from './plugins/dev-proxy';

export default defineConfig({
	plugins: [react(), devProxy()],
	server: { port: 5173, host: true },
});

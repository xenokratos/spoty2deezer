import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		host: true,
		proxy: {
			// Dev-only: front → backend proxy
			"/proxy": {
				target: "http://localhost:3001",
				changeOrigin: true,
				secure: false,
			},
		},
	},
	base: "/spoty2deezer/",
	build: {
		chunkSizeWarningLimit: 1000,
	},
});

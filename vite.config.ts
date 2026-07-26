import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  // Production is served from the Cloudflare Pages root. E2E keeps a nested
  // path so routing, manifest scope, and service-worker fallbacks stay tested.
  base: mode === 'e2e' ? '/barely-fit/' : '/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
}));

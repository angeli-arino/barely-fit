import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ command }) => ({
  // GitHub Pages hosts project sites below /<repository>/.
  base: command === 'build' ? '/barely-fit/' : '/',
  plugins: [react(), tailwindcss()],
  server: { host: true },
}));

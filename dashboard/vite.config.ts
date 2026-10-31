import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  // Demo mode bundles the hub's own ../PROJECT folder.
  server: { fs: { allow: ['..'] } },
});

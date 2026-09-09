import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  server: { fs: { strict: true, allow: [fileURLToPath(new URL('.', import.meta.url))] } },
  build: { rollupOptions: { output: { manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'] } } } }
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // MediaPipe's JS bundle alone is ~500 kB; it is cached offline anyway.
  build: { chunkSizeWarningLimit: 1200 },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Camera Wizard',
        short_name: 'Pose',
        description: 'Gợi ý dáng chụp ảnh du lịch',
        lang: 'vi',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including the wasm runtime and AI models,
        // so the app works with no network at all.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,wasm,task,tflite}'],
        maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
      },
    }),
  ],
});

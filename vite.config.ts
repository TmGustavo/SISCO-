import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kaluz Digital',
        short_name: 'Kaluz',
        description: 'Gestión de transporte, afiliados y turismo.',
        theme_color: '#0f766e',
        background_color: '#f8fafc',
        display: 'standalone',
      },
    }),
  ],
})

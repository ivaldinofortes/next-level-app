import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // Evita que o Vite tente enumerar interfaces de rede em runtimes onde isso falha
    // (ex.: alguns builds recentes do Node podem disparar uv_interface_addresses).
    host: '127.0.0.1',
    port: 3000,      // Usa a porta que abrimos no Docker
  }
})

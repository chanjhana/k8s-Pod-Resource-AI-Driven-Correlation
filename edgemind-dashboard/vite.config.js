import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8090',
      '/ws': {
        target: 'ws://localhost:8090',
        ws: true,
      },
      // Sensor-sim ports for local dev (requires kubectl port-forward)
      '/sensor1': {
        target: 'http://localhost:8081',
        rewrite: path => path.replace(/^\/sensor1/, ''),
      },
      '/sensor2': {
        target: 'http://localhost:8082',
        rewrite: path => path.replace(/^\/sensor2/, ''),
      },
      '/sensor3': {
        target: 'http://localhost:8083',
        rewrite: path => path.replace(/^\/sensor3/, ''),
      },
      '/alertmanager': {
        target: 'http://localhost:8006',
        rewrite: path => path.replace(/^\/alertmanager/, ''),
      },
    },
  },
})

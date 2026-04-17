import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/balldontlie': {
          target: 'https://api.balldontlie.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/balldontlie/, '/v1'),
          headers: {
            Authorization: env.BALLDONTLIE_API_KEY ?? '',
          },
        },
        '/api/nhl': {
          target: 'https://api-web.nhle.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/nhl/, ''),
        },
        '/api/mlb': {
          target: 'https://statsapi.mlb.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/mlb/, ''),
        },
      },
    },
  }
})

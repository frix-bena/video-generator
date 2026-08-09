import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import express from 'express'
import cors from 'cors'
import { createApiRouter } from './server/apiRouter.ts'

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    configureServer(server) {
      const apiApp = express();
      apiApp.use(cors());
      apiApp.use(createApiRouter());

      server.middlewares.use((req, res, next) => {
        if (req.url && (req.url === '/api' || req.url.startsWith('/api/'))) {
          // Strip /api prefix for router match
          const originalUrl = req.url;
          req.url = req.url.replace(/^\/api/, '') || '/';
          (apiApp as any)(req, res, (err: any) => {
            req.url = originalUrl;
            next(err);
          });
        } else {
          next();
        }
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), expressApiPlugin()],
  server: {
    port: 5173,
    host: true,
  }
})

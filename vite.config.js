import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// .env lives next to this file, whatever directory vite is started from
const configDir = fileURLToPath(new URL('.', import.meta.url));

// Local development mirrors production (deploy/nginx.conf + deploy/docker-entrypoint.sh):
//   /api/db/*          → PostgREST on localhost:3001 (npm run db:api)
//   /api/flow/<name>   → the flow's Pucho Studio webhook, with X-Inbound-Token and X-App-Url added
//                        here from .env (INBOUND_TOKEN, APP_URL) — never in the browser bundle
// The webhook URLs come from .env only (PLANNING_WORKFLOW_WEBHOOK_URL, BUILD_WORKFLOW_WEBHOOK_URL); they are no
// longer committed in this file (QA L-06).

const baseWebhook = (url) => String(url || '').replace(/\/+$/, '').replace(/\/(sync|test)$/, '');

function flowProxy(target, env) {
  const url = new URL(target);
  const appUrl = env.APP_URL || env.VITE_APP_URL || '';
  return {
    target: url.origin,
    changeOrigin: true,
    secure: true,
    proxyTimeout: 300000,
    timeout: 300000,
    rewrite: () => url.pathname,
    // POST only, as in production (Studio starts a run for any method): anything else gets a 404
    bypass: (req) => (req.method === 'POST' ? undefined : false),
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('cookie');
        proxyReq.removeHeader('authorization');
        if (env.INBOUND_TOKEN) proxyReq.setHeader('X-Inbound-Token', env.INBOUND_TOKEN);
        if (appUrl) proxyReq.setHeader('X-App-Url', appUrl.endsWith('/') ? appUrl : `${appUrl}/`);
      });
    }
  };
}

// No webhook URL in .env: the endpoint answers 404 and says why in the terminal, instead of calling a flow
// nobody configured.
function missingFlow(name) {
  return {
    target: 'http://127.0.0.1:9',
    bypass: () => {
      console.warn(`[flow] /api/flow/${name}: no webhook URL in .env (PLANNING_WORKFLOW_WEBHOOK_URL / BUILD_WORKFLOW_WEBHOOK_URL)`);
      return false;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDir, '');
  const planning = baseWebhook(env.PLANNING_WORKFLOW_WEBHOOK_URL || env.VITE_PLANNING_WORKFLOW_WEBHOOK_URL);
  const build = baseWebhook(env.BUILD_WORKFLOW_WEBHOOK_URL || env.VITE_BUILD_WORKFLOW_WEBHOOK_URL);

  return {
    envDir: configDir,
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        // Same path as production (nginx → PostgREST); run PostgREST locally on 3001 (npm run db:api)
        '/api/db': {
          target: 'http://localhost:3001',
          rewrite: (path) => path.replace(/^\/api\/db/, '')
        },
        // Same flow endpoints as production (exact names, so planning never matches planning-test)
        '^/api/flow/planning$': planning ? flowProxy(planning, env) : missingFlow('planning'),
        '^/api/flow/planning-test$': planning ? flowProxy(`${planning}/test`, env) : missingFlow('planning-test'),
        '^/api/flow/build$': build ? flowProxy(`${build}/sync`, env) : missingFlow('build')
      }
    }
  };
});

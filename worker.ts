import { app } from './api/index.ts';

export default {
  async fetch(request: Request, env: any, ctx: any) {
    // Pass the environment variables to the Hono app
    return app.fetch(request, env, ctx);
  },
};

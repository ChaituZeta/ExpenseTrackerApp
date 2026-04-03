import { handle } from 'hono/vercel';
import app from '../src/api/app.ts';

export const config = {
  runtime: 'edge',
};

export default handle(app);

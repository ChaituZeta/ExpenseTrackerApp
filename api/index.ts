import { handle } from 'hono/vercel';
import app from '../src/api/app';

export const config = {
  runtime: 'nodejs',
};

export default handle(app);

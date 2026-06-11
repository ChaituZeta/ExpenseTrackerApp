import { Hono } from 'hono';
import { handle } from '@hono/node-server/vercel';
import { env } from '../config/env.ts';
import { getSupabaseClient } from '../repositories/SupabaseClient.ts';

// Import Controllers
import { AuthController } from '../controllers/AuthController.ts';
import { TransactionController } from '../controllers/TransactionController.ts';
import { CategoryController } from '../controllers/CategoryController.ts';
import { BudgetController } from '../controllers/BudgetController.ts';
import { LogController } from '../controllers/LogController.ts';
import { AdminController } from '../controllers/AdminController.ts';

const app = new Hono();

// Export the Hono app instance separately for server.ts bridge
export { app };

// Global Error Handler & Enhanced Telemetry Logging
app.onError((err, c) => {
  console.error('[API ERROR LOG] [TIMESTAMP: ' + new Date().toISOString() + ']', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// Request Logger Middleware
app.use('*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  const start = Date.now();
  console.log(`[API REQUEST] [${new Date().toISOString()}] ${method} ${path}`);
  await next();
  const duration = Date.now() - start;
  console.log(`[API RESPONSE] [${new Date().toISOString()}] ${method} ${path} - Status: ${c.res.status} (${duration}ms)`);
});

// Dynamic Environment-based CORS allow list
app.use('*', async (c, next) => {
  const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
  const origin = c.req.header('Origin');
  if (origin) {
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.vercel.app') || origin.startsWith('http://localhost:')) {
      c.header('Access-Control-Allow-Origin', origin);
    } else {
      c.header('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000');
    }
  } else {
    c.header('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000');
  }
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.text('', 240 as any);
  await next();
});

// Ping, Diag & Health Check
app.get('/api/ping', (c) => {
  console.log('[API] Ping request received');
  return c.json({ status: 'ok', version: '2.1.0', time: new Date().toISOString() });
});

app.get('/api/health', async (c) => {
  console.log('[API] Health check request received');
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    return c.json({
      status: error ? "unhealthy" : "healthy",
      database: error ? "disconnected" : "connected",
      version: "2.1.0"
    });
  } catch (err: any) {
    console.error('[API] Health check exception:', err);
    return c.json({
      status: "unhealthy",
      database: "disconnected",
      version: "2.1.0"
    }, 500);
  }
});

app.get('/api/diag', async (c) => {
  console.log('[API] Diagnostic request received');
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    return c.json({ 
      db: error ? 'error' : 'ok', 
      db_error: error?.message,
      version: '2.1.0',
      url_masked: env.SUPABASE_URL ? `${env.SUPABASE_URL.substring(0, 15)}...` : 'not set',
      key_masked: env.SUPABASE_ANON_KEY ? `${env.SUPABASE_ANON_KEY.substring(0, 10)}...` : 'not set',
      env: { 
        SUPA_URL: !!env.SUPABASE_URL,
        SUPA_KEY: !!env.SUPABASE_ANON_KEY,
        SERVICE_KEY: !!env.SUPABASE_SERVICE_ROLE_KEY
      } 
    });
  } catch (e: any) {
    return c.json({ error: e.message, version: '2.1.0' }, 500);
  }
});

// Instantiate controllers
const authController = new AuthController();
const transactionController = new TransactionController();
const categoryController = new CategoryController();
const budgetController = new BudgetController();
const logController = new LogController();
const adminController = new AdminController();

// Auth Endpoints
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', authController.register);
app.post('/api/auth/forgot-password', authController.forgotPassword);
app.post('/api/auth/reset-password', authController.resetPassword);

// Activity Logs Endpoints
app.post('/api/logs/create', logController.create);

// Standard transactions, categories, budgets endpoints mapped to modular controllers for enterprise-grade compliance
app.get('/api/users/:userId/transactions', transactionController.getAll);
app.get('/api/transactions/:id', transactionController.getById);
app.post('/api/transactions', transactionController.create);
app.put('/api/transactions/:id', transactionController.update);
app.delete('/api/transactions/:id', transactionController.delete);

app.get('/api/users/:userId/categories', categoryController.getAll);
app.get('/api/categories/:id', categoryController.getById);
app.post('/api/categories', categoryController.create);
app.put('/api/categories/:id', categoryController.update);
app.delete('/api/categories/:id', categoryController.delete);

app.get('/api/users/:userId/budgets', budgetController.getAll);
app.get('/api/users/:userId/budgets/:month', budgetController.getByMonth);
app.post('/api/budgets', budgetController.create);
app.post('/api/budgets/upsert', budgetController.upsert);
app.put('/api/budgets/:id', budgetController.update);
app.delete('/api/budgets/:id', budgetController.delete);

// Admin Endpoints
app.get('/api/admin/users', adminController.getUsers);
app.get('/api/admin/transactions', adminController.getTransactions);
app.get('/api/admin/logs', adminController.getLogs);
app.post('/api/admin/create-user', adminController.createUser);
app.post('/api/admin/sync-profiles', adminController.syncProfiles);
app.put('/api/admin/users/:id', adminController.updateUser);
app.delete('/api/admin/users/:id', adminController.deleteUser);

export default handle(app);

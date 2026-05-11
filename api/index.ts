import { Hono } from 'hono';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { handle } from '@hono/node-server/vercel';

const app = new Hono();

// Export the Hono app instance separately for server.ts bridge
export { app };

// Global Error Handler
app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// Robust header helper
const getHeader = (c: any, name: string) => {
  const h = c.req.header(name);
  if (h) return h;
  const raw = c.req.raw?.headers;
  if (raw && typeof raw.get === 'function') return raw.get(name);
  return undefined;
};

// Simplified CORS
app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (c.req.method === 'OPTIONS') return c.text('', 204 as any);
  await next();
});

// Shared Logic
let supabaseClient: any = null;
let supabaseAdminClient: any = null;

const getSupabase = (c: any, isAdminAction = false) => {
  const envUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const envAnon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const envService = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = envUrl || 'https://poeyhgmbbpovbmonoeqi.supabase.co';
  const anon = envAnon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzY1NTUsImV4cCI6MjA4OTExMjU1NX0.5bsemjqGGvEqq_PCACmrag7UTsMgmVBmKJwDcvMwopE';
  const service = envService || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzNjU1NSwiZXhwIjoyMDg5MTEyNTU1fQ.LGge4j6tfSIpoL-AyvjJ3iBCNYTff1w2fNERFx-YtGw';
  
  if (!envUrl) console.warn('[Supabase] No environment URL found, using fallback');

  if (isAdminAction) {
    if (!supabaseAdminClient) {
      const key = (service && service.length > 20) ? service : anon;
      supabaseAdminClient = createClient(url, key, {
        auth: { persistSession: false },
        global: { headers: { 'x-my-custom-header': 'fintrack-admin' } }
      });
    }
    return supabaseAdminClient;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(url, anon, {
      auth: { persistSession: false }
    });
  }
  return supabaseClient;
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER || "cbogineni@gmail.com",
      pass: process.env.SMTP_PASS || "zmel ckmu jfqn pqwc",
    },
    // Add connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
};

const BRAND_PRIMARY = "#3E3C7A";
const getEmailTemplate = (title: string, content: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
    <div style="background-color: ${BRAND_PRIMARY}; padding: 30px; text-align: center; color: white;">
      <h1 style="margin: 0;">FinTrack</h1>
    </div>
    <div style="padding: 30px;">
      <h2>${title}</h2>
      ${content}
    </div>
  </div>
`;

const isAdmin = async (c: any) => {
  const authHeader = getHeader(c, 'Authorization');
  if (!authHeader) return { error: "Unauthorized", status: 401 };
  try {
    const token = authHeader.split(' ')[1];
    const supabase = getSupabase(c, true);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { error: "Invalid session", status: 401 };
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role === 'admin' || user.email === 'cbogineni@gmail.com') return { user };
    return { error: "Admin access required", status: 403 };
  } catch (err) {
    return { error: "Authorization failed", status: 500 };
  }
};

// Ping & Diag (explicit paths for Vercel)
app.get('/api/ping', (c) => {
  console.log('[API] Ping request received');
  return c.text('pong');
});
app.get('/api/diag', async (c) => {
  console.log('[API] Diagnostic request received');
  try {
    const supabase = getSupabase(c);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return c.json({ db: error ? 'error' : 'ok', env: { url: !!process.env.VITE_SUPABASE_URL || !!process.env.SUPABASE_URL, key: !!process.env.VITE_SUPABASE_ANON_KEY || !!process.env.SUPABASE_ANON_KEY } });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Helper for timeout
const withTimeout = (promise: Promise<any>, ms: number, message: string) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
};

// Robust body parser
const parseJsonBody = async (c: any, requestId: string): Promise<any> => {
  try {
    // Try direct JSON parsing first - most reliable in Node.js runtime
    console.log(`[${requestId}] Attempting c.req.json()...`);
    return await c.req.json();
  } catch (err: any) {
    console.warn(`[${requestId}] c.req.json() failed:`, err.message);
    try {
      // Fallback to text parsing
      console.log(`[${requestId}] Attempting c.req.text()...`);
      const text = await c.req.text();
      console.log(`[${requestId}] Raw body length: ${text?.length || 0}`);
      return text ? JSON.parse(text) : {};
    } catch (e: any) {
      console.warn(`[${requestId}] All body parse attempts failed:`, e.message);
      // Last resort: check if it's already parsed by a middleware (unlikely but possible)
      const rawReq = c.req.raw || c.req;
      if (rawReq.body && typeof rawReq.body === 'object' && !('getReader' in rawReq.body)) {
        return rawReq.body;
      }
      return {};
    }
  }
};

// Auth
app.post('/api/auth/login', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] LOGIN START - Headers:`, JSON.stringify(c.req.header()));
  
  try {
    // 1. Parse body with safety
    console.log(`[${requestId}] Reading body...`);
    const body = await parseJsonBody(c, requestId);
    const { email, password } = body;
    console.log(`[${requestId}] Body parsed for ${email || 'unknown'}`);

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // 2. Auth with Supabase
    console.log(`[${requestId}] Supabase signIn...`);
    const supabase = getSupabase(c);
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      60000,
      'Supabase auth timeout'
    );
    
    if (error) {
      console.log(`[${requestId}] Auth error: ${error.message}`);
      let msg = error.message;
      if (msg.toLowerCase().includes('invalid login credentials')) msg = "Invalid email or password";
      return c.json({ error: msg, code: error.name }, 401);
    }
    
    if (!data.user) {
      console.log(`[${requestId}] Auth success but no user returned`);
      return c.json({ error: 'Authentication succeeded but no user data was returned' }, 500);
    }

    console.log(`[${requestId}] Auth success for ${data.user.id}`);

    // 3. Fetch Profile (Non-fatal)
    console.log(`[${requestId}] Fetching profile...`);
    let profile: any = null;
    try {
      const { data: profileData, error: profileError } = await withTimeout(
        supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
        15000,
        'Profile fetch timeout'
      );
      if (profileError) console.warn(`[${requestId}] Profile fetch error:`, profileError.message);
      else profile = profileData;
    } catch (profileTimeoutErr: any) {
      console.warn(`[${requestId}] Profile fetch timed out or failed:`, profileTimeoutErr.message);
    }

    console.log(`[${requestId}] LOGIN COMPLETE`);
    
    return c.json({
      session: data.session,
      user: {
        id: data.user.id, 
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || 'User',
        phone: profile?.phone, 
        avatar_url: profile?.avatar_url,
        currency: profile?.currency || '₹',
        role: profile?.role || (data.user.email === 'cbogineni@gmail.com' ? 'admin' : 'user'),
      }
    });
  } catch (e: any) {
    console.error(`[${requestId}] LOGIN FATAL ERROR:`, e.message);
    return c.json({ error: e.message || 'Internal login error' }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/auth/register', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] REGISTER START`);
  
  try {
    const body = await parseJsonBody(c, requestId);
    const { email, password, name, phone } = body;
    console.log(`[${requestId}] Registering ${email}`);

    const supabase = getSupabase(c);
    const { data, error } = await withTimeout(
      supabase.auth.signUp({ email, password, options: { data: { name, phone, currency: '₹' } } }),
      60000,
      'Supabase registration timeout'
    );
    
    if (error) {
      console.log(`[${requestId}] Register error: ${error.message}`);
      let msg = error.message;
      if (msg.includes('already registered')) msg = "Email already in use";
      if (msg.includes('Password should be')) msg = "Password is too weak (min 6 characters)";
      return c.json({ error: msg }, 400);
    }
    
    if (data.user) {
      console.log(`[${requestId}] Creating profile for ${data.user.id}`);
      const adminClient = getSupabase(c, true);
      await withTimeout(
        adminClient.from('profiles').upsert({ id: data.user.id, email, name, phone, role: email === 'cbogineni@gmail.com' ? 'admin' : 'user', currency: '₹' }),
        10000,
        'Profile creation timeout'
      ).catch(e => console.warn(`[${requestId}] Profile upsert error:`, e.message));
    }
    
    console.log(`[${requestId}] REGISTER COMPLETE`);
    return c.json({ user: data.user, session: data.session });
  } catch (e: any) {
    console.error(`[${requestId}] REGISTER FATAL ERROR:`, e.message);
    return c.json({ error: e.message || 'Internal registration error' }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/auth/forgot-password', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] FORGOT-PASSWORD START`);
  try {
    const body = await parseJsonBody(c, requestId);
    const email = body.email || body.identifier;
    if (!email) return c.json({ error: "Email is required" }, 400);

    const supabase = getSupabase(c, true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    await withTimeout(
      supabase.from('otps').upsert({ email, otp, expires_at: expiresAt }, { onConflict: 'email' }),
      10000,
      'Database UPSERT timeout'
    );
    
    const transporter = getTransporter();
    await withTimeout(
      transporter.sendMail({
        from: `"FinTrack" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
        to: email, subject: "Reset Code",
        html: getEmailTemplate("Reset Password", `<p>Code: <b>${otp}</b></p>`),
      }),
      20000,
      'Email sending timeout'
    );
    
    console.log(`[${requestId}] FORGOT-PASSWORD COMPLETE`);
    return c.json({ message: "OTP sent" });
  } catch (e: any) {
    console.error(`[${requestId}] FORGOT-PASSWORD ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/auth/reset-password', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] RESET-PASSWORD START`);
  try {
    const body = await parseJsonBody(c, requestId);
    const { email, otp, newPassword } = body;
    const supabase = getSupabase(c, true);
    
    const { data: otpData } = await withTimeout(
      supabase.from('otps').select('*').eq('email', email).eq('otp', otp).gt('expires_at', new Date().toISOString()).maybeSingle(),
      10000,
      'OTP validation timeout'
    );
    
    if (!otpData) return c.json({ error: "Invalid OTP" }, 400);
    
    const { data: userData } = await withTimeout(
      supabase.auth.admin.listUsers(),
      15000,
      'User fetch timeout'
    );
    
    const user = userData?.users.find((u: any) => u.email === email);
    if (!user) return c.json({ error: "User not found" }, 404);
    
    await withTimeout(
      supabase.auth.admin.updateUserById(user.id, { password: newPassword }),
      15000,
      'Password update timeout'
    );
    
    await supabase.from('otps').delete().eq('email', email).catch(() => {});
    
    console.log(`[${requestId}] RESET-PASSWORD COMPLETE`);
    return c.json({ message: "Password reset successful" });
  } catch (e: any) {
    console.error(`[${requestId}] RESET-PASSWORD ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/logs/create', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const authHeader = getHeader(c, 'Authorization');
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.split(' ')[1];
    const body = await parseJsonBody(c, requestId);
    const { action, details } = body;
    const supabase = getSupabase(c);
    const { data: { user }, error: authErr } = await withTimeout(supabase.auth.getUser(token), 30000, 'Auth verification timeout');
    if (authErr || !user) return c.json({ error: "Invalid session" }, 401);
    
    const { error: insertErr } = await withTimeout(
      supabase.from('activity_logs').insert([{ user_id: user.id, user_name: user.user_metadata?.name || user.email, action, details }]),
      10000,
      'Log insertion timeout'
    );
    
    if (insertErr) {
      console.error(`[${requestId}] Log insertion error:`, insertErr.message);
      return c.json({ error: insertErr.message }, 500);
    }
    
    return c.json({ success: true });
  } catch (e: any) {
    console.error(`[${requestId}] ACTIVITY-LOG ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.get('/api/admin/users', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const auth = await isAdmin(c);
    if (auth.error) return c.json({ error: auth.error }, auth.status as any);
    
    const { data, error } = await withTimeout(
      getSupabase(c, true).from('profiles').select('*').order('created_at', { ascending: false }),
      15000,
      'Users fetch timeout'
    );
    
    if (error) {
      console.error(`[${requestId}] Admin users fetch error:`, error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (e: any) {
    console.error(`[${requestId}] ADMIN-USERS ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.get('/api/admin/transactions', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const auth = await isAdmin(c);
    if (auth.error) return c.json({ error: auth.error }, auth.status as any);
    
    const { data, error } = await withTimeout(
      getSupabase(c, true).from('transactions').select('*, category:categories(*)').order('date', { ascending: false }),
      20000,
      'Transactions fetch timeout'
    );
    
    if (error) {
      console.error(`[${requestId}] Admin transactions fetch error:`, error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (e: any) {
    console.error(`[${requestId}] ADMIN-TRANSACTIONS ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.get('/api/admin/logs', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  try {
    const auth = await isAdmin(c);
    if (auth.error) return c.json({ error: auth.error }, auth.status as any);
    
    const { data, error } = await withTimeout(
      getSupabase(c, true).from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100),
      15000,
      'Logs fetch timeout'
    );
    
    if (error) {
      console.error(`[${requestId}] Admin logs fetch error:`, error.message);
      return c.json({ error: error.message }, 500);
    }
    return c.json(data);
  } catch (e: any) {
    console.error(`[${requestId}] ADMIN-LOGS ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/admin/create-user', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] ADMIN CREATE-USER START`);
  try {
    const auth = await isAdmin(c);
    if (auth.error) return c.json({ error: auth.error }, auth.status as any);
    
    const body = await parseJsonBody(c, requestId);
    const { email, password, name, role } = body;
    console.log(`[${requestId}] Creating user ${email} with role ${role}`);
    
    const supabase = getSupabase(c, true);
    
    // 1. Create Auth User
    const { data: authUser, error: authErr } = await withTimeout(
      supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } }),
      20000,
      'Supabase auth user creation timeout'
    );
    
    if (authErr) {
      console.error(`[${requestId}] Auth creation error:`, authErr.message);
      let msg = authErr.message;
      if (msg.includes('already registered')) msg = "Email already in use";
      if (msg.includes('Password should be')) msg = "Password is too weak (min 6 characters)";
      return c.json({ error: msg }, 400);
    }
    
    if (!authUser.user) {
      console.error(`[${requestId}] Auth user creation succeeded but no user returned`);
      return c.json({ error: "Failed to retrieve created user data" }, 500);
    }
    
    // 2. Create Profile
    const { error: profileErr } = await withTimeout(
      supabase.from('profiles').upsert({ id: authUser.user.id, email, name, role: role || 'client' }),
      10000,
      'Profile upsert timeout'
    );
    
    if (profileErr) {
      console.error(`[${requestId}] Profile creation error:`, profileErr.message);
      // We don't return 400 here because the user is already created in Auth. 
      // But we should notify about the partial success.
      return c.json({ error: `User created in Auth, but profile sync failed: ${profileErr.message}`, partial: true }, 500);
    }
    
    // 3. Send Email (non-blocking)
    try {
      const transporter = getTransporter();
      await withTimeout(
        transporter.sendMail({
          from: `"FinTrack Admin" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
          to: email, subject: "Account Created",
          html: getEmailTemplate("Welcome!", `<p>An account has been created for you in FinTrack.</p><p>Email: <b>${email}</b></p><p>You can now log in to the system.</p>`),
        }),
        15000,
        'Email delivery timeout'
      );
    } catch (e: any) {
      console.warn(`[${requestId}] Welcome email failed:`, e.message);
    }
    
    console.log(`[${requestId}] ADMIN CREATE-USER COMPLETE`);
    return c.json({ message: "User created and profile synced successfully" });
  } catch (e: any) {
    console.error(`[${requestId}] ADMIN CREATE-USER FATAL ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

app.post('/api/admin/sync-profiles', async (c) => {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] SYNC-PROFILES START`);
  try {
    const auth = await isAdmin(c);
    if (auth.error) return c.json({ error: auth.error }, auth.status as any);
    
    const supabase = getSupabase(c, true);
    const { data: { users }, error } = await withTimeout(supabase.auth.admin.listUsers(), 20000, 'User list timeout');
    
    if (error) {
      console.error(`[${requestId}] List users error:`, error.message);
      return c.json({ error: error.message }, 500);
    }
    
    const profiles = users.map(u => ({ 
      id: u.id, 
      email: u.email, 
      name: u.user_metadata?.name || 'User', 
      role: u.email === 'cbogineni@gmail.com' ? 'admin' : 'client' 
    }));
    
    const { error: upsertErr } = await withTimeout(
      supabase.from('profiles').upsert(profiles, { onConflict: 'id', ignoreDuplicates: true }),
      20000,
      'Profiles batch upsert timeout'
    );
    
    if (upsertErr) {
      console.error(`[${requestId}] Upsert profiles error:`, upsertErr.message);
      return c.json({ error: upsertErr.message }, 500);
    }
    
    console.log(`[${requestId}] SYNC-PROFILES COMPLETE`);
    return c.json({ message: "Profiles synced successfully" });
  } catch (e: any) {
    console.error(`[${requestId}] SYNC-PROFILES ERROR:`, e.message);
    return c.json({ error: e.message }, e.message?.includes('timeout') ? 504 : 500);
  }
});

export default handle(app);

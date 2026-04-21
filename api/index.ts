import { Hono } from 'hono';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { handle } from 'hono/vercel';

const app = new Hono().basePath('/api');

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
  if (c.req.method === 'OPTIONS') return c.text('', 204);
  await next();
});

// Shared Logic
const getSupabase = (c: any, isAdminAction = false) => {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://poeyhgmbbpovbmonoeqi.supabase.co';
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzY1NTUsImV4cCI6MjA4OTExMjU1NX0.5bsemjqGGvEqq_PCACmrag7UTsMgmVBmKJwDcvMwopE';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzNjU1NSwiZXhwIjoyMDg5MTEyNTU1fQ.LGge4j6tfSIpoL-AyvjJ3iBCNYTff1w2fNERFx-YtGw';
  const key = (isAdminAction && service && service.length > 20) ? service : anon;
  return createClient(url, key);
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

// Ping & Diag
app.get('/ping', (c) => c.text('pong'));
app.get('/diag', async (c) => {
  try {
    const supabase = getSupabase(c);
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return c.json({ db: error ? 'error' : 'ok', env: { url: !!process.env.VITE_SUPABASE_URL, key: !!process.env.VITE_SUPABASE_ANON_KEY } });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// Auth
app.post('/auth/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    const supabase = getSupabase(c);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: error.message }, 401);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return c.json({
      session: data.session,
      user: {
        id: data.user.id, email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || 'User',
        phone: profile?.phone, avatar_url: profile?.avatar_url,
        currency: profile?.currency || '₹',
        role: profile?.role || (data.user.email === 'cbogineni@gmail.com' ? 'admin' : 'user'),
      }
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/auth/register', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    const supabase = getSupabase(c);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, phone, currency: '₹' } } });
    if (error) return c.json({ error: error.message }, 400);
    if (data.user) {
      const adminClient = getSupabase(c, true);
      await adminClient.from('profiles').upsert({ id: data.user.id, email, name, phone, role: email === 'cbogineni@gmail.com' ? 'admin' : 'user', currency: '₹' });
    }
    return c.json({ user: data.user, session: data.session });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/auth/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    const supabase = getSupabase(c, true);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await supabase.from('otps').upsert({ email, otp, expires_at: expiresAt }, { onConflict: 'email' });
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"FinTrack" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
      to: email, subject: "Reset Code",
      html: getEmailTemplate("Reset Password", `<p>Code: <b>${otp}</b></p>`),
    });
    return c.json({ message: "OTP sent" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/auth/reset-password', async (c) => {
  try {
    const { email, otp, newPassword } = await c.req.json();
    const supabase = getSupabase(c, true);
    const { data: otpData } = await supabase.from('otps').select('*').eq('email', email).eq('otp', otp).gt('expires_at', new Date().toISOString()).maybeSingle();
    if (!otpData) return c.json({ error: "Invalid OTP" }, 400);
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users.find((u: any) => u.email === email);
    if (!user) return c.json({ error: "User not found" }, 404);
    await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
    await supabase.from('otps').delete().eq('email', email);
    return c.json({ message: "Password reset successful" });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.post('/logs/create', async (c) => {
  try {
    const authHeader = getHeader(c, 'Authorization');
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    const token = authHeader.split(' ')[1];
    const { action, details } = await c.req.json();
    const supabase = getSupabase(c);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return c.json({ error: "Invalid session" }, 401);
    await supabase.from('activity_logs').insert([{ user_id: user.id, user_name: user.user_metadata?.name || user.email, action, details }]);
    return c.json({ success: true });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/admin/users', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);
  const { data, error } = await getSupabase(c, true).from('profiles').select('*').order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/transactions', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);
  const { data, error } = await getSupabase(c, true).from('transactions').select('*, category:categories(*)').order('date', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/logs', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);
  const { data, error } = await getSupabase(c, true).from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post('/admin/create-user', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);
  const { email, password, name, role } = await c.req.json();
  const supabase = getSupabase(c, true);
  const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
  if (authErr) return c.json({ error: authErr.message }, 400);
  await supabase.from('profiles').upsert({ id: authUser.user.id, email, name, role: role || 'client' });
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"FinTrack Admin" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
      to: email, subject: "Account Created",
      html: getEmailTemplate("Welcome!", `<p>Log in with ${email}</p>`),
    });
  } catch (e) {}
  return c.json({ message: "User created" });
});

app.post('/admin/sync-profiles', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);
  const supabase = getSupabase(c, true);
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) return c.json({ error: error.message }, 500);
  const profiles = users.map(u => ({ id: u.id, email: u.email, name: u.user_metadata?.name || 'User', role: u.email === 'cbogineni@gmail.com' ? 'admin' : 'client' }));
  await supabase.from('profiles').upsert(profiles, { onConflict: 'id', ignoreDuplicates: true });
  return c.json({ message: "Synced" });
});

export const config = { runtime: 'nodejs' };
export default handle(app);

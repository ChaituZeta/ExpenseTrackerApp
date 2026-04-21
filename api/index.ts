import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { handle } from 'hono/vercel';

const app = new Hono();

// Global Error Handler
app.onError((err, c) => {
  console.error('Hono Global Error:', err);
  return c.json({ 
    error: err.message || 'Internal Server Error',
    type: 'GlobalError'
  }, 500);
});

// Helper for robust header retrieval on Vercel Node runtime
const getHeader = (c: any, name: string) => {
  try {
    // 1. Try standard Hono way
    const h = c.req.header(name);
    if (h) return h;
  } catch (e) {
    // 2. Fallback to raw headers if Hono's normalization fails
    const rawHeaders = c.req.raw?.headers;
    if (rawHeaders) {
      if (typeof rawHeaders.get === 'function') return rawHeaders.get(name);
      return rawHeaders[name.toLowerCase()] || rawHeaders[name];
    }
  }
  return undefined;
};

// Middleware - Manual CORS to avoid buggy built-in middleware on Vercel Node
app.use('*', async (c, next) => {
  // We can't easily use the Origin header for logic if it crashes, 
  // so we set broad CORS and move on.
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  await next();
});

// Shared Logic
const getSupabase = (c: any) => {
  // Try all possible env sources for Vercel/Node, then fallback to hardcoded
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || c.env?.VITE_SUPABASE_URL || 'https://poeyhgmbbpovbmonoeqi.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || c.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzY1NTUsImV4cCI6MjA4OTExMjU1NX0.5bsemjqGGvEqq_PCACmrag7UTsMgmVBmKJwDcvMwopE';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || c.env?.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzNjU1NSwiZXhwIjoyMDg5MTEyNTU1fQ.LGge4j6tfSIpoL-AyvjJ3iBCNYTff1w2fNERFx-YtGw';

  // Use service key for admin actions if available, otherwise anon key
  const finalKey = (supabaseServiceKey && supabaseServiceKey.length > 20) ? supabaseServiceKey : supabaseAnonKey;
  
  return createClient(supabaseUrl, finalKey);
};

const getTransporter = (c: any) => {
  return nodemailer.createTransport({
    host: c.env?.SMTP_HOST || process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(c.env?.SMTP_PORT || process.env.SMTP_PORT || "587"),
    secure: (c.env?.SMTP_PORT || process.env.SMTP_PORT) === "465",
    auth: {
      user: c.env?.SMTP_USER || process.env.SMTP_USER || "cbogineni@gmail.com",
      pass: c.env?.SMTP_PASS || process.env.SMTP_PASS || "zmel ckmu jfqn pqwc",
    },
  });
};

const BRAND_PRIMARY = "#3E3C7A";
const getEmailTemplate = (title: string, content: string) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <div style="background-color: ${BRAND_PRIMARY}; padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">FinTrack</h1>
    </div>
    <div style="padding: 40px; background-color: white;">
      <h2 style="color: #111827; margin-top: 0; font-size: 24px; font-weight: 700;">${title}</h2>
      <div style="color: #4b5563; line-height: 1.6; font-size: 16px;">
        ${content}
      </div>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center; color: #9ca3af; font-size: 12px;">
        &copy; 2026 FinTrack. All rights reserved.
      </div>
    </div>
  </div>
`;

const isAdmin = async (c: any) => {
  const authHeader = getHeader(c, 'Authorization');
  if (!authHeader) return { error: "Unauthorized", status: 401 };
  
  try {
    const token = authHeader.split(' ')[1];
    if (!token) return { error: "No token provided", status: 401 };

    const supabase = getSupabase(c);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return { error: "Invalid session", status: 401 };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isDefaultAdmin = user.email === 'cbogineni@gmail.com';

    if (profile?.role === 'admin' || isDefaultAdmin) {
      if (isDefaultAdmin && profile?.role !== 'admin') {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || 'Admin',
          role: 'admin'
        });
      }
      return { user };
    } else {
      return { error: "Forbidden: Admin access required", status: 403 };
    }
  } catch (err: any) {
    return { error: "Internal server error during authorization", status: 500 };
  }
};

// Routes - support both with and without /api prefix for Vercel
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.post('/api/auth/login', async (c) => {
  const startTime = Date.now();
  let email = 'unknown';
  try {
    const body = await c.req.json().catch(() => ({}));
    email = body.email || 'not provided';
    const password = body.password;
    
    console.log(`[${startTime}] Login attempt: ${email}`);
    
    const supabase = getSupabase(c);
    
    // Auth call with increased timeout (20s)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      console.error(`Login error for ${email}:`, error.message);
      return c.json({ error: error.message }, 401);
    }
    
    if (!data.user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    console.log(`Login success for ${email} in ${Date.now() - startTime}ms`);

    return c.json({
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata.name || 'User',
        phone: profile?.phone || data.user.user_metadata.phone,
        avatar_url: profile?.avatar_url || data.user.user_metadata.avatar_url,
        currency: profile?.currency || data.user.user_metadata.currency || '₹',
        role: profile?.role || (data.user.email === 'cbogineni@gmail.com' ? 'admin' : 'user'),
      }
    });
  } catch (err: any) {
    console.error(`Critical login error for ${email}:`, err);
    return c.json({ error: err.message || "Internal server error" }, 500);
  }
});

app.post('/auth/login', async (c) => {
  // Alias for /api/auth/login (some Vercel setups strip /api, some don't)
  return c.redirect('/api/auth/login', 307);
});

app.post('/api/auth/register', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();
    const supabase = getSupabase(c);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone, currency: '₹' }
      }
    });
    
    if (error) return c.json({ error: error.message }, 400);

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        phone,
        role: email === 'cbogineni@gmail.com' ? 'admin' : 'user',
        currency: '₹'
      });
    }

    return c.json({ 
      user: data.user, 
      session: data.session,
      message: "Registration successful" 
    });
  } catch (err: any) {
    return c.json({ error: err.message || "Internal server error" }, 500);
  }
});

app.post('/auth/register', async (c) => c.redirect('/api/auth/register', 307));

app.post('/api/logs/create', async (c) => {
  try {
    const authHeader = getHeader(c, 'Authorization');
    if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
    
    const token = authHeader.split(' ')[1];
    const { action, details } = await c.req.json().catch(() => ({}));
    const supabase = getSupabase(c);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return c.json({ error: "Invalid session" }, 401);

    const { error } = await supabase.from('activity_logs').insert([{
      user_id: user.id,
      user_name: user.user_metadata?.name || user.email,
      action,
      details,
    }]);

    if (error) throw error;
    return c.json({ success: true });
  } catch (err: any) {
    console.error("Logging error:", err);
    return c.json({ error: err.message }, 500);
  }
});

app.post('/logs/create', async (c) => c.redirect('/api/logs/create', 307));

app.get('/api/admin/users', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/users', async (c) => c.redirect('/api/admin/users', 301));

app.get('/api/admin/transactions', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/transactions', async (c) => c.redirect('/api/admin/transactions', 301));

app.get('/api/admin/logs', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/logs', async (c) => c.redirect('/api/admin/logs', 301));

app.post('/api/admin/create-user', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.get('/admin/logs', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

app.post('/admin/create-user', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const { email, password, name, role } = await c.req.json();
  const supabase = getSupabase(c);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (authError) return c.json({ error: authError.message }, 400);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      email,
      name,
      role: role || 'client'
    });

  if (profileError) return c.json({ error: profileError.message }, 500);

  // Send welcome email
  try {
    const transporter = getTransporter(c);
    const env = c.env as any;
    const appUrl = env?.APP_URL || process.env.APP_URL || "https://fintrack.app";
    
    await transporter.sendMail({
      from: `"FinTrack Admin" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
      to: email,
      subject: "Welcome to FinTrack!",
      html: getEmailTemplate(
        "Welcome to FinTrack!",
        `<p>Hello ${name},</p>
         <p>An account has been created for you on FinTrack.</p>
         <p><strong>Your Login Details:</strong></p>
         <p>Email: ${email}</p>
         <p>Password: ${password}</p>
         <p style="margin-top: 20px;">
           <a href="${appUrl}/login" style="background-color: ${BRAND_PRIMARY}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Login to Your Account</a>
         </p>
         <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">Please change your password after your first login.</p>`
      ),
    });
  } catch (emailErr) {
    console.error("Failed to send welcome email:", emailErr);
  }

  return c.json({ message: "User created successfully", user: authUser.user });
});

app.post('/api/admin/sync-profiles', async (c) => {
  const auth = await isAdmin(c);
  if (auth.error) return c.json({ error: auth.error }, auth.status as any);

  const supabase = getSupabase(c);
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) return c.json({ error: authError.message }, 500);

  const profiles = users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || 'User',
    role: user.email === 'cbogineni@gmail.com' ? 'admin' : 'client'
  }));

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profiles, { onConflict: 'id', ignoreDuplicates: true });

  if (profileError) return c.json({ error: profileError.message }, 500);
  return c.json({ message: `Synced ${profiles.length} profiles` });
});

app.post('/admin/sync-profiles', async (c) => c.redirect('/api/admin/sync-profiles', 307));

app.post('/api/auth/forgot-password', async (c) => {
  const { email } = await c.req.json().catch(() => ({}));
  if (!email) return c.json({ error: "Email is required" }, 400);
  const supabase = getSupabase(c);

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('otps')
    .upsert({ email, otp, expires_at: expiresAt }, { onConflict: 'email' });

  if (error) return c.json({ error: "Failed to generate OTP" }, 500);

  try {
    const transporter = getTransporter(c);
    await transporter.sendMail({
      from: `"FinTrack Support" <${process.env.SMTP_USER || "cbogineni@gmail.com"}>`,
      to: email,
      subject: "Your Password Reset Code",
      html: getEmailTemplate(
        "Password Reset Request",
        `<p>You requested a password reset. Use the code below to reset your password:</p>
         <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: ${BRAND_PRIMARY}; border-radius: 12px; margin: 24px 0;">
           ${otp}
         </div>
         <p>This code will expire in 15 minutes.</p>
         <p>If you didn't request this, you can safely ignore this email.</p>`
      ),
    });
    return c.json({ message: "OTP sent successfully" });
  } catch (err) {
    return c.json({ error: "Failed to send email" }, 500);
  }
});

app.post('/auth/forgot-password', async (c) => c.redirect('/api/auth/forgot-password', 307));

app.post('/api/auth/reset-password', async (c) => {
  const { email, otp, newPassword } = await c.req.json().catch(() => ({}));
  const supabase = getSupabase(c);

  const { data: otpData, error: otpError } = await supabase
    .from('otps')
    .select('*')
    .eq('email', email)
    .eq('otp', otp)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (otpError || !otpData) {
    return c.json({ error: "Invalid or expired OTP" }, 400);
  }

  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  const user = userData?.users.find((u: any) => u.email === email);

  if (userError || !user) {
    return c.json({ error: "User not found" }, 404);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError) return c.json({ error: updateError.message }, 500);

  await supabase.from('otps').delete().eq('email', email);

  return c.json({ message: "Password updated successfully" });
});

app.post('/auth/reset-password', async (c) => c.redirect('/api/auth/reset-password', 307));

export const config = {
  runtime: 'nodejs',
};

export { app };
export default handle(app);

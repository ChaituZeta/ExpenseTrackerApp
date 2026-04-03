import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { 
  supabase, 
  transporter, 
  getEmailTemplate, 
  isAdmin, 
  BRAND_PRIMARY, 
  BRAND_ACCENT 
} from "./api/lib/shared.js";

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Request logger (ignores internal Vite/source file requests to reduce noise)
  app.use((req, res, next) => {
    const isInternalRequest = 
      req.url.startsWith('/src/') || 
      req.url.startsWith('/@vite/') || 
      req.url.startsWith('/node_modules/') ||
      req.url.includes('.tsx') ||
      req.url.includes('.ts') ||
      req.url.includes('.css');

    if (!isInternalRequest) {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    }
    next();
  });

  // Admin Middleware
  const isAdminMiddleware = async (req: any, res: any, next: any) => {
    const auth = await isAdmin(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ message: auth.error });
    }
    req.user = auth.user;
    next();
  };

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Admin API Routes
  app.get("/api/admin/users", isAdminMiddleware, async (req, res) => {
    console.log("GET /api/admin/users hit");
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Admin users error details:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch users" });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Admin users catch error:", error.message || error);
      res.status(500).json({ message: "Internal server error fetching users" });
    }
  });

  app.get("/api/admin/transactions", isAdminMiddleware, async (req, res) => {
    console.log("GET /api/admin/transactions hit");
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          categories (name, icon, color)
        `)
        .order("date", { ascending: false });
      
      if (error) {
        console.error("Admin transactions error details:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch transactions" });
      }
      
      const formatted = data.map((t: any) => ({
        ...t,
        category_name: t.categories?.name,
        category_icon: t.categories?.icon,
        category_color: t.categories?.color,
        user_name: "User",
        user_email: "Email",
      }));
      
      res.json(formatted);
    } catch (error: any) {
      console.error("Admin transactions catch error:", error.message || error);
      res.status(500).json({ message: "Internal server error fetching transactions" });
    }
  });

  app.get("/api/admin/logs", isAdminMiddleware, async (req, res) => {
    console.log("GET /api/admin/logs hit");
    try {
      const { data, error } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Admin logs error details:", error.message);
        return res.status(500).json({ message: error.message || "Failed to fetch logs" });
      }
      res.json(data);
    } catch (error: any) {
      console.error("Admin logs catch error:", error.message || error);
      res.status(500).json({ message: "Internal server error fetching logs" });
    }
  });

  app.post("/api/admin/create-user", isAdminMiddleware, async (req, res) => {
    console.log("POST /api/admin/create-user hit", req.body.email);
    const { email, password, name, phone, role, sendEmail } = req.body;
    
    try {
      if (!supabase.auth.admin) {
        throw new Error("Supabase Admin SDK not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is set.");
      }

      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone }
      });

      if (authError) {
        console.error("Admin create user auth error:", authError.message);
        return res.status(400).json({ message: authError.message });
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: authUser.user.id,
          email: email,
          name: name,
          phone: phone,
          role: role || 'user' 
        });

      if (profileError) {
        console.error("Admin create user profile error:", profileError.message);
      }

      if (sendEmail) {
        try {
          const html = getEmailTemplate(
            "Your Account Credentials",
            `<p>Hi <strong>${name}</strong>,</p>
             <p>An account has been created for you on FinTrack.</p>
             <p><strong>Your Login Credentials:</strong></p>
             <div style="background-color: #f9fafb; padding: 20px; border-radius: 16px; margin: 20px 0; font-family: monospace;">
               Email: ${email}<br>
               Password: ${password}
             </div>
             <p>Please log in and change your password immediately for security.</p>
             <div style="margin-top: 30px; text-align: center;">
               <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="background-color: ${BRAND_ACCENT}; color: white; padding: 14px 32px; border-radius: 16px; text-decoration: none; font-weight: bold; display: inline-block;">Login Now</a>
             </div>`
          );

          await transporter.sendMail({
            from: '"FinTrack Admin" <admin@fintrack.com>',
            to: email,
            subject: "Your FinTrack Account Credentials",
            html,
          });
        } catch (emailErr) {
          console.error("Failed to send welcome email:", emailErr);
        }
      }

      res.json({ success: true, user: authUser.user });
    } catch (error: any) {
      console.error("Admin create user catch error:", error.message || error);
      res.status(500).json({ message: error.message || "Internal server error creating user" });
    }
  });

  app.post("/api/admin/sync-profiles", isAdminMiddleware, async (req, res) => {
    console.log("POST /api/admin/sync-profiles hit");
    try {
      if (!supabase.auth.admin) {
        console.error("Supabase Admin SDK not initialized");
        return res.status(500).json({ 
          message: "Supabase Admin SDK not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Secrets." 
        });
      }
      
      console.log("Listing users from auth.admin...");
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.error("Auth admin list users error:", authError.message);
        throw authError;
      }

      console.log(`Found ${authUsers.length} users in auth. Syncing to profiles...`);
      const results = [];
      for (const user of authUsers) {
        const { error: upsertError } = await supabase.from('profiles').upsert([{
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          role: user.email === 'cbogineni@gmail.com' ? 'admin' : 'user'
        }], { onConflict: 'id' });
        
        if (!upsertError) {
          results.push(user.email);
        } else {
          console.error(`Failed to sync profile for ${user.email}:`, upsertError.message);
        }
      }

      console.log(`Sync complete. Synced ${results.length} profiles.`);
      res.json({ success: true, synced: results });
    } catch (error: any) {
      console.error("Sync profiles catch error:", error.message || error);
      res.status(500).json({ message: error.message || "Internal server error syncing profiles" });
    }
  });

  // Catch-all for API routes to return JSON 404 instead of HTML
  app.all("/api/*", (req, res) => {
    console.warn(`API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: `API route not found: ${req.method} ${req.url}` });
  });

  // API Routes
  app.post("/api/email/welcome", async (req, res) => {
    const { email, name, details } = req.body;
    console.log(`Attempting to send welcome email to ${email}`);
    try {
      const html = getEmailTemplate(
        "Welcome to FinTrack!",
        `<p>Hi <strong>${name}</strong>,</p>
         <p>Thank you for joining FinTrack. We're excited to help you manage your finances better!</p>
         <p><strong>Your Account Details:</strong></p>
         <div style="background-color: #f9fafb; padding: 15px; border-radius: 12px; margin: 15px 0; font-family: monospace;">
           ${details ? details.replace(/\n/g, '<br>') : `Email: ${email}`}
         </div>
         <p>You can now start adding your income, expenses, and setting budgets to stay on track.</p>
         <div style="margin-top: 30px; text-align: center;">
           <a href="${process.env.APP_URL || 'http://localhost:3000'}" style="background-color: ${BRAND_ACCENT}; color: white; padding: 14px 32px; border-radius: 16px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 4px 14px 0 rgba(243, 166, 28, 0.39);">Go to Dashboard</a>
         </div>`
      );

      const info = await transporter.sendMail({
        from: '"FinTrack" <noreply@fintrack.com>',
        to: email,
        subject: "Welcome to FinTrack!",
        html,
      });

      console.log("Welcome email sent:", info.messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Welcome email error:", error);
      res.status(500).json({ message: "Failed to send welcome email" });
    }
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({ message: "Email or mobile number is required" });
    }
    console.log(`Forgot password request for: ${identifier}`);
    try {
      // Search for user by email or phone in profiles table
      let { data: profiles, error } = await supabase
        .from("profiles")
        .select("email, name, phone")
        .eq("email", identifier)
        .maybeSingle();

      if (!profiles && !error) {
        const { data: phoneProfile, error: phoneError } = await supabase
          .from("profiles")
          .select("email, name, phone")
          .eq("phone", identifier)
          .maybeSingle();
        profiles = phoneProfile;
        error = phoneError;
      }

      if (error) {
        console.error("Supabase profile lookup error details:", error.message);
        throw error;
      }

      if (!profiles) {
        console.log(`User not found in profiles for identifier: ${identifier}`);
        return res.status(404).json({ message: "User not found. Please check your email or mobile number." });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Store OTP in Supabase 'otps' table
      const { error: otpError } = await supabase
        .from('otps')
        .upsert({ 
          identifier, 
          otp, 
          expires, 
          email: profiles.email 
        });

      if (otpError) {
        console.error("Failed to store OTP in Supabase:", otpError.message);
        return res.status(500).json({ message: "Failed to process request. Database table 'otps' might be missing." });
      }

      const html = getEmailTemplate(
        "Password Reset OTP",
        `<p>Hi ${profiles.name},</p>
         <p>You requested to reset your password. Use the following OTP to proceed:</p>
         <div style="background-color: #f3f4f6; padding: 30px; border-radius: 16px; text-align: center; margin: 24px 0;">
           <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: ${BRAND_PRIMARY};">${otp}</span>
         </div>
         <p>This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.</p>`
      );

      const info = await transporter.sendMail({
        from: '"FinTrack Security" <security@fintrack.com>',
        to: profiles.email,
        subject: "Password Reset OTP",
        html,
      });

      console.log("OTP email sent:", info.messageId);
      res.json({ success: true, message: "OTP sent to registered email" });
    } catch (error: any) {
      console.error("Forgot password error details:", error.message, error.details, error.hint, error.code);
      res.status(500).json({ message: "Failed to process request. Please check SMTP settings and Supabase connection." });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { identifier, otp, newPassword } = req.body;

    try {
      // Retrieve OTP from Supabase 'otps' table
      const { data: stored, error: otpError } = await supabase
        .from('otps')
        .select('*')
        .eq('identifier', identifier)
        .maybeSingle();

      if (otpError || !stored || stored.otp !== otp || new Date(stored.expires).getTime() < Date.now()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      if (!supabase.auth.admin) {
        return res.status(500).json({ 
          message: "Supabase Admin SDK not initialized. Ensure SUPABASE_SERVICE_ROLE_KEY is set in Secrets." 
        });
      }

      // Update password in Supabase Auth
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', stored.email)
        .maybeSingle();

      if (profileError || !userProfile) {
        console.error("Profile lookup error during reset:", JSON.stringify(profileError, null, 2));
        return res.status(404).json({ message: "User profile not found" });
      }

      const { error } = await supabase.auth.admin.updateUserById(
        userProfile.id,
        { password: newPassword }
      );

      if (error) {
        console.error("Supabase admin update error details:", JSON.stringify(error, null, 2));
        throw error;
      }

      // Delete OTP after successful reset
      await supabase.from('otps').delete().eq('identifier', identifier);

      res.json({ success: true, message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler caught:", err);
    res.status(err.status || 500).json({ 
      message: err.message || "Internal server error",
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const finalKey = (supabaseServiceKey && supabaseServiceKey !== "your-service-role-key") 
  ? supabaseServiceKey 
  : supabaseAnonKey;

export const supabase = createClient(
  supabaseUrl || "",
  finalKey || ""
);

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER || "cbogineni@gmail.com",
    pass: process.env.SMTP_PASS || "zmel ckmu jfqn pqwc",
  },
});

export const BRAND_PRIMARY = "#3E3C7A";
export const BRAND_ACCENT = "#F3A61C";

export const getEmailTemplate = (title: string, content: string) => `
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

export const isAdmin = async (req: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return { error: "Unauthorized", status: 401 };
  
  try {
    const token = authHeader.split(' ')[1];
    if (!token) return { error: "No token provided", status: 401 };

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

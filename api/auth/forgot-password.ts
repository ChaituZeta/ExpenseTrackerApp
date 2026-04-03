import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, getEmailTemplate, transporter, BRAND_PRIMARY } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
    // Note: User needs to create this table: 
    // create table otps (identifier text primary key, otp text, expires timestamp with time zone, email text);
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
      // Fallback: if table doesn't exist, this will fail. 
      // In a real serverless app, we MUST have a persistent store.
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
    console.error("Forgot password error details:", error.message);
    res.status(500).json({ message: "Failed to process request. Please check SMTP settings and Supabase connection." });
  }
}

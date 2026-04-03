import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
  } catch (error: any) {
    console.error("Reset password error:", error.message);
    res.status(500).json({ message: "Failed to reset password" });
  }
}

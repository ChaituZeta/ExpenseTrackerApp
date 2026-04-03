import { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, isAdmin, getEmailTemplate, transporter, BRAND_ACCENT } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const auth = await isAdmin(req);
  if (auth.error) {
    return res.status(auth.status || 401).json({ message: auth.error });
  }

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
}

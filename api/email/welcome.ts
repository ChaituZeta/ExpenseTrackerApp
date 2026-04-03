import { VercelRequest, VercelResponse } from '@vercel/node';
import { transporter, getEmailTemplate, BRAND_ACCENT } from '../lib/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
}

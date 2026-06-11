import { z } from "zod";
import { AuthService } from "../services/AuthService.ts";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password should be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  identifier: z.string().email("Invalid email format").optional(),
}).refine(data => data.email || data.identifier, {
  message: "Email or identifier is required",
  path: ["email"]
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
  otp: z.string().min(1, "OTP is required"),
  newPassword: z.string().min(6, "New password should be at least 6 characters"),
});

// Robust body parser helper matching server conventions
const parseJsonBody = async (c: any, requestId: string): Promise<any> => {
  try {
    return await c.req.json();
  } catch (err: any) {
    console.warn(`[${requestId}] parseJsonBody failed, trying text fallback:`, err.message);
    try {
      const text = await c.req.text();
      return text ? JSON.parse(text) : {};
    } catch (e: any) {
      console.warn(`[${requestId}] Body parse failed:`, e.message);
      return {};
    }
  }
};

export class AuthController {
  private authService = new AuthService();

  login = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] LOGIN START`);
    try {
      const body = await parseJsonBody(c, requestId);
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const { email, password } = parsed.data;
      console.log(`[${requestId}] Login attempt for: ${email}`);

      const result = await this.authService.login(email, password);
      console.log(`[${requestId}] LOGIN SUCCESS`);
      
      return c.json({
        v: "2.1.0",
        ...result
      });
    } catch (e: any) {
      console.error(`[${requestId}] LOGIN FATAL ERROR:`, e.message);
      return c.json({ error: e.message || "Internal login error" }, 500);
    }
  };

  register = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] REGISTER START`);
    try {
      const body = await parseJsonBody(c, requestId);
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const { email, password, name, phone } = parsed.data;
      console.log(`[${requestId}] Registering ${email}`);

      const result = await this.authService.register(email, password, name, phone);
      console.log(`[${requestId}] REGISTER COMPLETE`);
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] REGISTER FATAL ERROR:`, e.message);
      return c.json({ error: e.message || "Internal registration error" }, e.message?.includes("timeout") ? 504 : 500);
    }
  };

  forgotPassword = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] FORGOT-PASSWORD START`);
    try {
      const body = await parseJsonBody(c, requestId);
      const parsed = forgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const email = parsed.data.email || parsed.data.identifier;
      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const result = await this.authService.forgotPassword(email);
      console.log(`[${requestId}] FORGOT-PASSWORD COMPLETE`);
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] FORGOT-PASSWORD ERROR:`, e.message);
      return c.json({ error: e.message }, e.message?.includes("timeout") ? 504 : 500);
    }
  };

  resetPassword = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] RESET-PASSWORD START`);
    try {
      const body = await parseJsonBody(c, requestId);
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const { email, otp, newPassword } = parsed.data;
      const result = await this.authService.resetPassword(email, otp, newPassword);
      console.log(`[${requestId}] RESET-PASSWORD COMPLETE`);
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] RESET-PASSWORD ERROR:`, e.message);
      return c.json({ error: e.message }, e.message?.includes("timeout") ? 504 : 500);
    }
  };
}

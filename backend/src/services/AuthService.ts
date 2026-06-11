import { AuthRepository } from "../repositories/AuthRepository.ts";
import { emailService } from "./EmailService.ts";
import { withTimeout } from "../utils/timeout.ts";

export class AuthService {
  private authRepository = new AuthRepository();

  async login(email: string, password: string) {
    const { data, error } = await this.authRepository.signInWithPassword(email, password);
    
    if (error) {
      throw new Error(error.message);
    }
    
    if (!data.user || !data.session) {
      throw new Error("Incomplete auth data returned from Supabase");
    }
    
    const profileResult = await this.authRepository.getProfile(data.user.id);
    const profile = profileResult.data;

    return {
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || "User",
        phone: profile?.phone,
        avatar_url: profile?.avatar_url,
        currency: profile?.currency || "₹",
        role: profile?.role || (data.user.email === "cbogineni@gmail.com" ? "admin" : "user"),
      }
    };
  }

  async register(email: string, password: string, name: string, phone?: string) {
    const { data, error } = await withTimeout(
      this.authRepository.signUp(email, password, name, phone),
      60000,
      "Supabase registration timeout"
    );

    if (error) {
      let msg = error.message;
      if (msg.includes("already registered")) msg = "Email already in use";
      if (msg.includes("Password should be")) msg = "Password is too weak (min 6 characters)";
      throw new Error(msg);
    }

    if (data.user) {
      const profile = {
        id: data.user.id,
        email,
        name,
        phone,
        role: email === "cbogineni@gmail.com" ? "admin" : "user",
        currency: "₹"
      };
      
      await withTimeout(
        this.authRepository.upsertProfile(profile),
        10000,
        "Profile creation timeout"
      ).catch(e => console.warn(`Profile upsert error during registration:`, e.message));
    }

    return { user: data.user, session: data.session };
  }

  async forgotPassword(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await withTimeout(
      this.authRepository.upsertOTP(email, otp, expiresAt),
      10000,
      "Database UPSERT timeout"
    );

    await withTimeout(
      emailService.sendMail(
        email,
        "Reset Code",
        "Reset Password",
        `<p>Code: <b>${otp}</b></p>`
      ),
      20000,
      "Email sending timeout"
    );

    return { message: "OTP sent" };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const { data: otpData } = await withTimeout(
      this.authRepository.getValidOTP(email, otp),
      10000,
      "OTP validation timeout"
    );

    if (!otpData) {
      throw new Error("Invalid OTP");
    }

    const { data: userData } = await withTimeout(
      this.authRepository.listAuthUsers(),
      15000,
      "User fetch timeout"
    );

    const user = userData?.users.find((u: any) => u.email === email);
    if (!user) {
      throw new Error("User not found");
    }

    await withTimeout(
      this.authRepository.updateAuthUserPassword(user.id, newPassword),
      15000,
      "Password update timeout"
    );

    await this.authRepository.deleteOTP(email).catch(err => {
      console.warn("Failed to clean up OTP code:", err.message);
    });

    return { message: "Password reset successful" };
  }

  async verifySession(token: string) {
    const { data: { user }, error } = await withTimeout(
      this.authRepository.getUserByToken(token),
      30000,
      "Auth verification timeout"
    );
    if (error || !user) {
      throw new Error("Invalid session");
    }
    return user;
  }

  async verifyAdmin(token: string) {
    const { data: { user }, error } = await withTimeout(
      this.authRepository.getUserByToken(token),
      30000,
      "Auth verification timeout"
    );
    if (error || !user) {
      throw new Error("Invalid session");
    }
    
    const profileResult = await this.authRepository.getProfile(user.id);
    const profile = profileResult.data;
    
    if (profile?.role === "admin" || user.email === "cbogineni@gmail.com") {
      return user;
    }
    
    throw new Error("Admin access required");
  }
}

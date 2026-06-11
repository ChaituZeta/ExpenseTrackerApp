import { AdminRepository } from "../repositories/AdminRepository.ts";
import { AuthRepository } from "../repositories/AuthRepository.ts";
import { TransactionRepository } from "../repositories/TransactionRepository.ts";
import { LogRepository } from "../repositories/LogRepository.ts";
import { emailService } from "./EmailService.ts";
import { withTimeout } from "../utils/timeout.ts";

export class AdminService {
  private adminRepository = new AdminRepository();
  private authRepository = new AuthRepository();
  private transactionRepository = new TransactionRepository();
  private logRepository = new LogRepository();

  async getUsers() {
    const { data, error } = await withTimeout(
      this.adminRepository.getAllProfiles(),
      15000,
      "Users fetch timeout"
    );

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async getTransactions() {
    const { data, error } = await withTimeout(
      this.transactionRepository.getAdminAll(),
      20000,
      "Transactions fetch timeout"
    );

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async getLogs() {
    const { data, error } = await withTimeout(
      this.logRepository.getAdminLogs(),
      15000,
      "Logs fetch timeout"
    );

    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  async createUser(email: string, password: string, name: string, role?: string) {
    // 1. Create Auth User
    const { data: authUser, error: authErr } = await withTimeout(
      this.authRepository.createAuthUser(email, password, name),
      20000,
      "Supabase auth user creation timeout"
    );

    if (authErr) {
      let msg = authErr.message;
      if (msg.includes("already registered")) msg = "Email already in use";
      if (msg.includes("Password should be")) msg = "Password is too weak (min 6 characters)";
      throw new Error(msg);
    }

    if (!authUser.user) {
      throw new Error("Failed to retrieve created user data");
    }

    // 2. Create Profile
    const profile = {
      id: authUser.user.id,
      email,
      name,
      role: role || "client"
    };

    const { error: profileErr } = await withTimeout(
      this.authRepository.upsertProfile(profile),
      10000,
      "Profile upsert timeout"
    );

    if (profileErr) {
      throw new Error(`User created in Auth, but profile sync failed: ${profileErr.message}`);
    }

    // 3. Send Email (non-blocking)
    emailService.sendMail(
      email,
      "Account Created",
      "Welcome!",
      `<p>An account has been created for you in FinTrack.</p><p>Email: <b>${email}</b></p><p>You can now log in to the system.</p>`
    ).catch((e: any) => {
      console.warn("Welcome email failed in AdminService:", e.message);
    });

    return { message: "User created and profile synced successfully" };
  }

  async syncProfiles() {
    const { data: { users }, error } = await withTimeout(
      this.authRepository.listAuthUsers(),
      20000,
      "User list timeout"
    );

    if (error) {
      throw new Error(error.message);
    }

    const profiles = users.map(u => ({
      id: u.id,
      email: u.email!,
      name: u.user_metadata?.name || "User",
      role: u.email === "cbogineni@gmail.com" ? "admin" : "client"
    }));

    const results = await withTimeout(
      Promise.all(profiles.map(p => this.authRepository.upsertProfile(p))),
      20000,
      "Profiles batch upsert timeout"
    );

    const firstErr = results.find(r => r.error);
    if (firstErr) {
      throw new Error(firstErr.error!.message);
    }

    return { message: "Profiles synced successfully" };
  }

  async updateUser(id: string, data: any) {
    const { error } = await withTimeout(
      this.authRepository.updateProfile(id, data),
      15000,
      "Profile update timeout"
    );
    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  }

  async deleteUser(id: string) {
    const { error } = await withTimeout(
      this.authRepository.deleteProfile(id),
      15000,
      "Profile deletion timeout"
    );
    if (error) {
      throw new Error(error.message);
    }
    return { success: true };
  }
}

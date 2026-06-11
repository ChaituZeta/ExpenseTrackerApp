import { z } from "zod";
import { AdminService } from "../services/AdminService.ts";
import { AuthService } from "../services/AuthService.ts";

const adminCreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["admin", "user", "client"]).optional(),
});

const getHeader = (c: any, name: string) => {
  const h = c.req.header(name);
  if (h) return h;
  const raw = c.req.raw?.headers;
  if (raw && typeof raw.get === 'function') return raw.get(name);
  return undefined;
};

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

const getAdminToken = (c: any) => {
  const authHeader = getHeader(c, "Authorization");
  if (!authHeader) throw new Error("Unauthorized");
  return authHeader.split(" ")[1];
};

export class AdminController {
  private adminService = new AdminService();
  private authService = new AuthService();

  getUsers = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const result = await this.adminService.getUsers();
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN-USERS ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  getTransactions = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const result = await this.adminService.getTransactions();
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN-TRANSACTIONS ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  getLogs = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const result = await this.adminService.getLogs();
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN-LOGS ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  createUser = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] ADMIN CREATE-USER START`);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const body = await parseJsonBody(c, requestId);
      const parsed = adminCreateUserSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const { email, password, name, role } = parsed.data;
      console.log(`[${requestId}] Creating user ${email} with role ${role}`);
      
      const result = await this.adminService.createUser(email, password, name, role);
      console.log(`[${requestId}] ADMIN CREATE-USER COMPLETE`);
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN CREATE-USER FATAL ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  syncProfiles = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] SYNC-PROFILES START`);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const result = await this.adminService.syncProfiles();
      console.log(`[${requestId}] SYNC-PROFILES COMPLETE`);
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] SYNC-PROFILES ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  updateUser = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const id = c.req.param("id");
      const body = await parseJsonBody(c, requestId);
      const result = await this.adminService.updateUser(id, body);
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN-UPDATE-USER ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };

  deleteUser = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const token = getAdminToken(c);
      await this.authService.verifyAdmin(token);
      
      const id = c.req.param("id");
      const result = await this.adminService.deleteUser(id);
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ADMIN-DELETE-USER ERROR:`, e.message);
      const status = e.message === "Unauthorized" ? 401 : e.message === "Admin access required" ? 403 : 500;
      return c.json({ error: e.message }, status);
    }
  };
}

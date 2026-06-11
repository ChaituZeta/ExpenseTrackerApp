import { z } from "zod";
import { LogService } from "../services/LogService.ts";
import { AuthService } from "../services/AuthService.ts";

const logCreateSchema = z.object({
  action: z.string().min(1, "Action tag is required"),
  details: z.string().min(1, "Details message is required"),
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

export class LogController {
  private logService = new LogService();
  private authService = new AuthService();

  create = async (c: any) => {
    const requestId = Math.random().toString(36).substring(7);
    try {
      const authHeader = getHeader(c, "Authorization");
      if (!authHeader) return c.json({ error: "Unauthorized" }, 401);
      
      const token = authHeader.split(" ")[1];
      const body = await parseJsonBody(c, requestId);
      const parsed = logCreateSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      
      const { action, details } = parsed.data;
      const user = await this.authService.verifySession(token);
      
      const result = await this.logService.create(
        user.id,
        user.user_metadata?.name || user.email || "User",
        action,
        details
      );
      
      return c.json(result);
    } catch (e: any) {
      console.error(`[${requestId}] ACTIVITY-LOG ERROR:`, e.message);
      return c.json({ error: e.message }, e.message?.includes("timeout") ? 504 : 401);
    }
  };
}

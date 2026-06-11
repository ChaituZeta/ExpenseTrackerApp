import { z } from "zod";
import { BudgetService } from "../services/BudgetService.ts";

const createBudgetSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  category_id: z.number().int("Invalid category ID format"),
  amount: z.number().positive("Amount must be positive"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must match YYYY-MM format"),
});

const updateBudgetSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
});

export class BudgetController {
  private budgetService = new BudgetService();

  getAll = async (c: any) => {
    try {
      const userId = c.req.param("userId");
      const budgets = await this.budgetService.getAll(userId);
      return c.json(budgets);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  getByMonth = async (c: any) => {
    try {
      const userId = c.req.param("userId");
      const month = c.req.param("month");
      const budgets = await this.budgetService.getByMonth(userId, month);
      return c.json(budgets);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  create = async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = createBudgetSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.budgetService.create(parsed.data);
      return c.json(result, 201);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  update = async (c: any) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const parsed = updateBudgetSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.budgetService.update(id, parsed.data);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  delete = async (c: any) => {
    try {
      const id = c.req.param("id");
      const result = await this.budgetService.delete(id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  upsert = async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await this.budgetService.upsert(body);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };
}

import { z } from "zod";
import { TransactionService } from "../services/TransactionService.ts";

const createTransactionSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  category_id: z.number().int().optional().nullable(),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(["income", "expense", "adjustment"]),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must match YYYY-MM-DD"),
});

const updateTransactionSchema = z.object({
  category_id: z.number().int().optional().nullable(),
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.enum(["income", "expense", "adjustment"]).optional(),
  description: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must match YYYY-MM-DD").optional(),
});

export class TransactionController {
  private transactionService = new TransactionService();

  getAll = async (c: any) => {
    try {
      const userId = c.req.param("userId");
      const transactions = await this.transactionService.getAll(userId);
      return c.json(transactions);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  getById = async (c: any) => {
    try {
      const id = c.req.param("id");
      const transaction = await this.transactionService.getById(id);
      if (!transaction) return c.json({ error: "Transaction not found" }, 404);
      return c.json(transaction);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  create = async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = createTransactionSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.transactionService.create(parsed.data);
      return c.json(result, 210);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  update = async (c: any) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const parsed = updateTransactionSchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.transactionService.update(id, parsed.data);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  delete = async (c: any) => {
    try {
      const id = c.req.param("id");
      const result = await this.transactionService.delete(id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };
}

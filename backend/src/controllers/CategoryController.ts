import { z } from "zod";
import { CategoryService } from "../services/CategoryService.ts";

const createCategorySchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["income", "expense", "adjustment"]),
  icon: z.string().optional(),
  color: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  type: z.enum(["income", "expense", "adjustment"]).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export class CategoryController {
  private categoryService = new CategoryService();

  getAll = async (c: any) => {
    try {
      const userId = c.req.param("userId");
      const categories = await this.categoryService.getAll(userId);
      return c.json(categories);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  getById = async (c: any) => {
    try {
      const id = c.req.param("id");
      const category = await this.categoryService.getById(id);
      if (!category) return c.json({ error: "Category not found" }, 404);
      return c.json(category);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  create = async (c: any) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = createCategorySchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.categoryService.create(parsed.data);
      return c.json(result, 201);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  update = async (c: any) => {
    try {
      const id = c.req.param("id");
      const body = await c.req.json().catch(() => ({}));
      const parsed = updateCategorySchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0].message }, 400);
      }
      const result = await this.categoryService.update(id, parsed.data);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };

  delete = async (c: any) => {
    try {
      const id = c.req.param("id");
      const result = await this.categoryService.delete(id);
      return c.json(result);
    } catch (e: any) {
      return c.json({ error: e.message }, 500);
    }
  };
}

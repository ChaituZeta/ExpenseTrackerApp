import { CategoryRepository } from "../repositories/CategoryRepository.ts";

export class CategoryService {
  private categoryRepository = new CategoryRepository();

  async getAll(userId: string) {
    const { data, error } = await this.categoryRepository.getAll(userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getById(id: string | number) {
    const { data, error } = await this.categoryRepository.getById(id);
    if (error) throw new Error(error.message);
    return data;
  }

  async create(data: { user_id: string; name: string; type: string; icon?: string; color?: string }) {
    if (!data.name || data.name.trim() === "") {
      throw new Error("Category name is required");
    }
    const { data: result, error } = await this.categoryRepository.create(data);
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string | number, data: Partial<{ name: string; type: string; icon?: string; color?: string }>) {
    if (data.name !== undefined && (!data.name || data.name.trim() === "")) {
      throw new Error("Category name cannot be empty");
    }
    const { data: result, error } = await this.categoryRepository.update(id, data);
    if (error) throw new Error(error.message);
    return result;
  }

  async delete(id: string | number) {
    const { error } = await this.categoryRepository.delete(id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}

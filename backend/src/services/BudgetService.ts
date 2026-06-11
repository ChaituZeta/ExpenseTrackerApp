import { BudgetRepository } from "../repositories/BudgetRepository.ts";

export class BudgetService {
  private budgetRepository = new BudgetRepository();

  async getAll(userId: string) {
    const { data, error } = await this.budgetRepository.getAll(userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getByMonth(userId: string, month: string) {
    const { data, error } = await this.budgetRepository.getByMonth(userId, month);
    if (error) throw new Error(error.message);
    return data;
  }

  async create(data: { user_id: string; category_id: number; amount: number; month: string }) {
    if (data.amount <= 0) {
      throw new Error("Budget amount must be greater than zero");
    }
    const { data: result, error } = await this.budgetRepository.create(data);
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string | number, data: Partial<{ amount: number }>) {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error("Budget amount must be greater than zero");
    }
    const { data: result, error } = await this.budgetRepository.update(id, data);
    if (error) throw new Error(error.message);
    return result;
  }

  async delete(id: string | number) {
    const { error } = await this.budgetRepository.delete(id);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async upsert(data: any) {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error("Budget amount must be greater than zero");
    }
    const { data: result, error } = await this.budgetRepository.upsert(data);
    if (error) throw new Error(error.message);
    return result;
  }
}

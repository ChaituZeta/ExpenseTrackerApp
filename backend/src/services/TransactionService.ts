import { TransactionRepository } from "../repositories/TransactionRepository.ts";

export class TransactionService {
  private transactionRepository = new TransactionRepository();

  async getAll(userId: string) {
    const { data, error } = await this.transactionRepository.getAll(userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getById(id: string | number) {
    const { data, error } = await this.transactionRepository.getById(id);
    if (error) throw new Error(error.message);
    return data;
  }

  async create(data: { user_id: string; category_id?: number | null; amount: number; type: string; description?: string; date: string }) {
    if (data.amount <= 0) {
      throw new Error("Transaction amount must be greater than zero");
    }
    const { data: result, error } = await this.transactionRepository.create(data);
    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string | number, data: Partial<{ category_id?: number | null; amount: number; type: string; description?: string; date: string }>) {
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error("Transaction amount must be greater than zero");
    }
    const { data: result, error } = await this.transactionRepository.update(id, data);
    if (error) throw new Error(error.message);
    return result;
  }

  async delete(id: string | number) {
    const { error } = await this.transactionRepository.delete(id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}

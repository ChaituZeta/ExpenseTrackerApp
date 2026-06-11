import { LogRepository } from "../repositories/LogRepository.ts";

export class LogService {
  private logRepository = new LogRepository();

  async create(user_id: string, user_name: string, action: string, details: string) {
    const { error } = await this.logRepository.create({
      user_id,
      user_name,
      action,
      details,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  }

  async getUserLogs(userId: string) {
    const { data, error } = await this.logRepository.getUserLogs(userId);
    if (error) throw new Error(error.message);
    return data;
  }

  async getAdminLogs() {
    const { data, error } = await this.logRepository.getAdminLogs();
    if (error) throw new Error(error.message);
    return data;
  }
}

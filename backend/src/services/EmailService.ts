import nodemailer from "nodemailer";
import { env } from "../config/env.ts";

const BRAND_PRIMARY = "#3E3C7A";

export class EmailService {
  private getTransporter() {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  private getEmailTemplate(title: string, content: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background-color: ${BRAND_PRIMARY}; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0;">FinTrack</h1>
        </div>
        <div style="padding: 30px;">
          <h2>${title}</h2>
          ${content}
        </div>
      </div>
    `;
  }

  async sendMail(to: string, subject: string, title: string, bodyHtml: string) {
    const transporter = this.getTransporter();
    const html = this.getEmailTemplate(title, bodyHtml);
    return await transporter.sendMail({
      from: `"FinTrack" <${env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();

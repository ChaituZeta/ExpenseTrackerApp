import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is missing"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is missing"),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is missing"),
  SMTP_PORT: z.preprocess((val) => parseInt(String(val), 10), z.number().int()),
  SMTP_USER: z.string().email("SMTP_USER must be a valid email address"),
  SMTP_PASS: z.string().min(1, "SMTP_PASS is missing"),
  ALLOWED_ORIGINS: z.string().optional().default("http://localhost:3000"),
});

// Safely gather existing variables supporting fallback configurations
const rawEnv = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: process.env.SMTP_PORT || "587",
  SMTP_USER: process.env.SMTP_USER || "cbogineni@gmail.com",
  SMTP_PASS: process.env.SMTP_PASS || "zmel ckmu jfqn pqwc",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error("❌ CRITICAL BOOT ERROR: Environment validation failed:", parsed.error.format());
  throw new Error("Missing or invalid required environment variables. Please check your config.");
}

export const env = parsed.data;

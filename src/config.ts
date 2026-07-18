import "dotenv/config";
import { z } from "zod";

const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  OPENAI_API_KEY: optionalSecret,
  OPENAI_MODEL: z.string().min(1).default("gpt-5.6"),
  SUPABASE_URL: z
    .string()
    .url()
    .default("https://sftdtlrrkxavklyvixoo.supabase.co"),
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:8787"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  HOST: z.string().min(1).default("127.0.0.1"),
  DEMO_ADMIN_TOKEN: optionalSecret,
  DEMO_IN_MEMORY: z.enum(["0", "1"]).default("0"),
});

export type AppConfig = {
  openaiApiKey?: string;
  openaiModel: string;
  supabaseUrl: string;
  supabaseServiceRoleKey?: string;
  publicBaseUrl: string;
  port: number;
  host: string;
  demoAdminToken?: string;
  demoInMemory: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const value = envSchema.parse(env);
  return {
    openaiApiKey: value.OPENAI_API_KEY,
    openaiModel: value.OPENAI_MODEL,
    supabaseUrl: value.SUPABASE_URL.replace(/\/$/, ""),
    supabaseServiceRoleKey: value.SUPABASE_SERVICE_ROLE_KEY,
    publicBaseUrl: value.PUBLIC_BASE_URL.replace(/\/$/, ""),
    port: value.PORT,
    host: value.HOST,
    demoAdminToken: value.DEMO_ADMIN_TOKEN,
    demoInMemory: value.DEMO_IN_MEMORY === "1",
  };
}

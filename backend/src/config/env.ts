import path from "path";
import dotenv from "dotenv";

export const backendRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });
dotenv.config();

function toBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === "true";
}

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: toNumber(process.env.PORT, 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://127.0.0.1:5173",
  dbPath:
    process.env.DB_PATH ?? path.resolve(backendRoot, "data/smart-and-fun-safety-classroom.sqlite"),
  sessionTtlHours: toNumber(process.env.SESSION_TTL_HOURS, 72),
  sparkApiUrl:
    process.env.SPARK_API_URL ??
    "https://spark-api-open.xf-yun.com/v1/chat/completions",
  sparkModel: process.env.SPARK_MODEL ?? "lite",
  sparkAppId: process.env.SPARK_APP_ID ?? "",
  sparkApiKey: process.env.SPARK_API_KEY ?? "",
  sparkApiSecret: process.env.SPARK_API_SECRET ?? "",
  sparkApiPassword: process.env.SPARK_API_PASSWORD ?? "",
  aiFallbackEnabled: toBoolean(process.env.AI_FALLBACK_ENABLED, true),
};

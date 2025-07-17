import { config } from "dotenv";
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

export const {
  PORT,
  DB_URI,
  NODE_ENV,
  SERVER_URL,
  JWT_SECRET,
} = process.env;
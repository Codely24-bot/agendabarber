import dotenv from "dotenv";

dotenv.config();

export const DEFAULT_BARBERSHOP_ID = process.env.BARBEARIA_ID || "default";
export const DEFAULT_BARBERSHOP_NAME =
  process.env.BARBEARIA_NOME || "Barbearia Principal";

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USER || "admin",
    password: process.env.ADMIN_PASS || "admin123"
  };
}

export function getPublicApiUrl() {
  return process.env.API_URL || "";
}


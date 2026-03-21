import { getAdminCredentials } from "../config.js";

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();
  const admin = getAdminCredentials();

  if (!token || token !== admin.password) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return next();
}

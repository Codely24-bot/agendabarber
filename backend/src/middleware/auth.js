import dotenv from "dotenv";

dotenv.config();

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "").trim();
  if (!token || token !== process.env.ADMIN_PASS) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

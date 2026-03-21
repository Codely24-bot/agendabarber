import express from "express";
import { getAdminCredentials } from "../config.js";

const router = express.Router();

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const admin = getAdminCredentials();

  if (username === admin.username && password === admin.password) {
    return res.json({ token: admin.password });
  }

  return res.status(401).json({ error: "Credenciais invalidas" });
});

export default router;

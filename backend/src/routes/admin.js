import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.post("/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    return res.json({ token: process.env.ADMIN_PASS });
  }
  return res.status(401).json({ error: "Credenciais invalidas" });
});

export default router;

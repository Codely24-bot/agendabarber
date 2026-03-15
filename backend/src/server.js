import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import horariosRoutes from "./routes/horarios.js";
import agendamentosRoutes from "./routes/agendamentos.js";
import adminRoutes from "./routes/admin.js";
import relatoriosRoutes from "./routes/relatorios.js";
import { startReminders } from "./services/reminders.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(adminRoutes);
app.use(horariosRoutes);
app.use(agendamentosRoutes);
app.use(relatoriosRoutes);

startReminders();

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});

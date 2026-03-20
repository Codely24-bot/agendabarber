import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import chatbotModule from "../../chatbot/robo.js";
import horariosRoutes from "./routes/horarios.js";
import agendamentosRoutes from "./routes/agendamentos.js";
import adminRoutes from "./routes/admin.js";
import relatoriosRoutes from "./routes/relatorios.js";
import { startReminders } from "./services/reminders.js";
import { errorHandler } from "./middleware/errorHandler.js";
import servicosRoutes from "./routes/servicos.js";
import { ensureDefaultServices } from "./services/serviceCatalog.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");
const { initializeChatbot, registerChatbotRoutes } = chatbotModule;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use(adminRoutes);
app.use(horariosRoutes);
app.use(agendamentosRoutes);
app.use(relatoriosRoutes);
app.use(servicosRoutes);
registerChatbotRoutes(app);

app.use(express.static(frontendDistPath));

app.get("*", (req, res, next) => {
  if (
    req.path.startsWith("/auth") ||
    req.path.startsWith("/horarios") ||
    req.path.startsWith("/agendar") ||
    req.path.startsWith("/agendamento") ||
    req.path.startsWith("/agendamentos") ||
    req.path.startsWith("/relatorios") ||
    req.path.startsWith("/servicos") ||
    req.path === "/health"
  ) {
    return next();
  }

  return res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use(errorHandler);

startReminders();
ensureDefaultServices().catch((error) => {
  console.error("Falha ao semear servicos padrao:", error);
});
initializeChatbot().catch((error) => {
  console.error("Falha ao iniciar chatbot integrado:", error);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API rodando na porta ${port}`);
});

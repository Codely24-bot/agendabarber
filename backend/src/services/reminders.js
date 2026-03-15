import cron from "node-cron";
import { query } from "../db.js";
import { sendChatbotConfirmation } from "../integrations/chatbotAdapter.js";

export function startReminders() {
  cron.schedule("0 * * * *", async () => {
    const result = await query(
      `
        SELECT *
        FROM agendamentos
        WHERE status = 'confirmado'
          AND data = CURRENT_DATE
          AND hora = to_char((CURRENT_TIME + interval '2 hours')::time, 'HH24:MI')
      `
    );

    for (const agendamento of result.rows) {
      await sendChatbotConfirmation({
        ...agendamento,
        lembrete: true
      });
    }
  });
}

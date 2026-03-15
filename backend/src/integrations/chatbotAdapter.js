import dotenv from "dotenv";

dotenv.config();

export async function sendChatbotConfirmation(agendamento) {
  if (!process.env.CHATBOT_WEBHOOK_URL) {
    return { ok: false, skipped: true };
  }

  const payload = {
    type: "agendamento_confirmado",
    data: agendamento
  };

  const response = await fetch(process.env.CHATBOT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { ok: response.ok };
}

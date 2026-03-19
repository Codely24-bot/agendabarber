import dotenv from "dotenv";

dotenv.config();

async function sendWebhook(payload) {
  if (!process.env.CHATBOT_WEBHOOK_URL) {
    return { ok: false, skipped: true };
  }

  const response = await fetch(process.env.CHATBOT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { ok: response.ok };
}

export async function sendChatbotConfirmation(agendamento) {
  return sendWebhook({
    type: "agendamento_confirmado",
    data: agendamento
  });
}

export async function sendChatbotCompletionThanks(agendamento) {
  return sendWebhook({
    type: "agendamento_concluido",
    data: {
      telefone: agendamento.telefone,
      texto: `Obrigado, ${agendamento.nome}, pela confianca e pelo compromisso com seu horario. Foi um prazer atender voce na ${process.env.BARBEARIA_NOME || "barbearia"}. Esperamos voce novamente!`
    }
  });
}

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
      texto: `Agradecemos, ${agendamento.nome}, pela confianca em nosso atendimento. Foi um prazer recebe-lo(a) na ${process.env.BARBEARIA_NOME || "barbearia"}. Esperamos ve-lo(a) novamente em breve.`
    }
  });
}

export async function sendChatbotTextMessage({ telefone, texto }) {
  return sendWebhook({
    type: "mensagem_customizada",
    data: {
      telefone,
      texto
    }
  });
}

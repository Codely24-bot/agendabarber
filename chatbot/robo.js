const http = require("http");
const qrcode = require("qrcode-terminal");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const API_URL = process.env.API_URL || "http://localhost:4000";
const BARBEARIA_ID = process.env.BARBEARIA_ID || "default";
const PORT = Number(process.env.PORT) || 3000;

let ultimoQr = null;
let qrDataUrl = null;
let qrPngBuffer = null;
let qrAtualizadoEm = null;
let botConectado = false;

const escapeHtml = (valor = "") =>
  valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process"
    ]
  }
});

client.on("qr", (qr) => {
  console.log("Escaneie o QR Code:");
  qrcode.generate(qr, { small: false });
});

client.on("ready", () => {
  console.log("BOT ONLINE COM SUCESSO");
});

client.on("disconnected", (reason) => {
  console.log("WhatsApp desconectado:", reason);
});

const atualizarQrImagem = async (qr) => {
  ultimoQr = qr;
  qrAtualizadoEm = new Date().toISOString();

  try {
    const opcoesQr = {
      errorCorrectionLevel: "H",
      margin: 2,
      scale: 12,
      width: 420,
      type: "image/png"
    };

    qrDataUrl = await QRCode.toDataURL(qr, opcoesQr);
    qrPngBuffer = await QRCode.toBuffer(qr, opcoesQr);
  } catch (erro) {
    qrDataUrl = null;
    qrPngBuffer = null;
    console.log("Erro ao gerar QR:", erro);
  }
};

client.on("qr", atualizarQrImagem);

client.on("ready", () => {
  botConectado = true;
  ultimoQr = null;
  qrDataUrl = null;
  qrPngBuffer = null;
  qrAtualizadoEm = new Date().toISOString();
});

client.on("disconnected", () => {
  botConectado = false;
  ultimoQr = null;
  qrDataUrl = null;
  qrPngBuffer = null;
});

const headersSemCache = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store"
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
  });

const servidor = http.createServer(async (req, res) => {
  if (req.url === "/qr.png") {
    if (!qrPngBuffer) {
      res.writeHead(404, {
        ...headersSemCache,
        "Content-Type": "application/json; charset=utf-8"
      });
      res.end(
        JSON.stringify({ status: botConectado ? "conectado" : "aguardando_qr" })
      );
      return;
    }

    res.writeHead(200, {
      ...headersSemCache,
      "Content-Type": "image/png",
      "Content-Length": qrPngBuffer.length
    });
    res.end(qrPngBuffer);
    return;
  }

  if (req.url === "/qr") {
    const pagina = qrDataUrl
      ? `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="15" />
    <title>QR Code WhatsApp</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4efe6;
        --card: #fffdf8;
        --text: #1f2937;
        --muted: #6b7280;
        --accent: #1d9b5f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, #fff7df 0, transparent 35%),
          linear-gradient(180deg, #f8f1e7 0%, var(--bg) 100%);
        font-family: Arial, sans-serif;
        color: var(--text);
        padding: 24px;
      }
      main {
        width: min(100%, 560px);
        background: var(--card);
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
        text-align: center;
      }
      img {
        width: min(100%, 420px);
        height: auto;
        background: #fff;
        border-radius: 18px;
        padding: 16px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 28px;
      }
      p {
        margin: 0 0 12px;
        color: var(--muted);
        line-height: 1.5;
      }
      .status {
        display: inline-block;
        margin-top: 16px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(29, 155, 95, 0.12);
        color: var(--accent);
        font-size: 14px;
        font-weight: bold;
      }
      code {
        display: block;
        margin-top: 16px;
        word-break: break-all;
        color: var(--muted);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Escaneie o QR Code</h1>
      <p>Abra esta pagina e escaneie no WhatsApp Web.</p>
      <img src="${qrDataUrl || ""}" alt="QR Code do WhatsApp" />
      <div class="status">Atualizado em: ${escapeHtml(qrAtualizadoEm || "")}</div>
      <code>/qr.png</code>
    </main>
  </body>
</html>`
      : botConectado
      ? `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="20" />
    <title>WhatsApp Conectado</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background:
          radial-gradient(circle at top, #e8fff2 0, transparent 35%),
          linear-gradient(180deg, #effaf3 0%, #e5f7eb 100%);
        font-family: Arial, sans-serif;
        padding: 24px;
        text-align: center;
        color: #14532d;
      }
      main {
        max-width: 480px;
        background: #fcfffd;
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 18px 40px rgba(20, 83, 45, 0.12);
      }
      .status {
        display: inline-block;
        margin-top: 12px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(22, 163, 74, 0.14);
        color: #15803d;
        font-size: 14px;
        font-weight: bold;
      }
      p {
        color: #166534;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>WhatsApp conectado</h1>
      <p>O bot ja esta autenticado.</p>
      <div class="status">Atualizado em: ${escapeHtml(qrAtualizadoEm || new Date().toISOString())}</div>
    </main>
  </body>
</html>`
      : `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="10" />
    <title>QR Code WhatsApp</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f4efe6;
        font-family: Arial, sans-serif;
        padding: 24px;
        text-align: center;
        color: #1f2937;
      }
      main {
        max-width: 480px;
        background: #fffdf8;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 18px 40px rgba(31, 41, 55, 0.12);
      }
      p {
        color: #6b7280;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Aguardando QR Code</h1>
      <p>Assim que o WhatsApp gerar um novo QR, esta pagina exibe a imagem.</p>
    </main>
  </body>
</html>`;

    res.writeHead(200, {
      ...headersSemCache,
      "Content-Type": "text/html; charset=utf-8"
    });
    res.end(pagina);
    return;
  }

  if (req.url === "/webhook" && req.method === "POST") {
    const body = await readBody(req);
    const payload = JSON.parse(body || "{}");
    if (payload?.data?.telefone) {
      const numero = payload.data.telefone.replace(/\D/g, "");
      const chatId = `${numero}@c.us`;
      const texto = payload.data.lembrete
        ? `Lembrete: seu horario e hoje as ${payload.data.hora}.`
        : `Agendamento confirmado para ${payload.data.data} as ${payload.data.hora}.`;
      await client.sendMessage(chatId, texto);
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const status = ultimoQr ? "qr_disponivel" : botConectado ? "conectado" : "aguardando_qr";

  res.writeHead(200, {
    ...headersSemCache,
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(
    JSON.stringify({
      status,
      qrPagePath: "/qr",
      qrImagePath: "/qr.png",
      updatedAt: qrAtualizadoEm
    })
  );
});

servidor.listen(PORT, () => {
  console.log(`Painel do QR ativo na porta ${PORT}. Use /qr para abrir a imagem.`);
});

client.initialize();

const sessions = new Map();
const antiSpam = new Map();

const normalizarTexto = (texto) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const horariosRegex = /^\d{2}:\d{2}$/;
const dataRegex = /^\d{4}-\d{2}-\d{2}$/;

const servicos = ["Corte", "Barba", "Corte e Barba"];

async function apiRequest(path, method = "GET", body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Erro na API");
  }
  return response.json();
}

client.on("message", async (msg) => {
  try {
    if (!msg.from) return;
    if (msg.from === "status@broadcast") return;
    if (msg.from.endsWith("@g.us")) return;
    if (msg.fromMe) return;
    if (!msg.body) return;

    const agora = Date.now();
    const ultimo = antiSpam.get(msg.from) || 0;
    if (agora - ultimo < 2500) return;
    antiSpam.set(msg.from, agora);

    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const textoOriginal = msg.body.trim();
    const texto = normalizarTexto(textoOriginal);

    if (!sessions.has(msg.from)) {
      sessions.set(msg.from, { step: "menu" });
    }

    const session = sessions.get(msg.from);

    const typing = async () => {
      await chat.sendStateTyping();
      await delay(1000);
    };

    if (texto === "cancelar") {
      session.step = "menu";
      session.data = null;
      session.hora = null;
      session.nome = null;
      session.telefone = null;
      session.servico = null;
      await typing();
      await client.sendMessage(msg.from, "Ok, reiniciamos. Digite agendar para comecar.");
      return;
    }

    if (session.step === "menu") {
      if (["oi", "ola", "agendar", "menu", "agenda"].includes(texto)) {
        session.step = "data";
        await typing();
        await client.sendMessage(
          msg.from,
          "Vamos agendar. Informe a data no formato YYYY-MM-DD."
        );
        return;
      }

      await typing();
      await client.sendMessage(msg.from, "Digite agendar para iniciar o atendimento.");
      return;
    }

    if (session.step === "data") {
      if (!dataRegex.test(texto)) {
        await typing();
        await client.sendMessage(
          msg.from,
          "Data invalida. Use o formato YYYY-MM-DD. Exemplo: 2026-03-20."
        );
        return;
      }
      session.data = texto;
      const horarios = await apiRequest(
        `/horarios-disponiveis?data=${encodeURIComponent(texto)}&barbeariaId=${encodeURIComponent(BARBEARIA_ID)}`
      );
      if (!horarios.length) {
        await typing();
        await client.sendMessage(
          msg.from,
          "Nao ha horarios disponiveis nessa data. Envie outra data."
        );
        return;
      }
      session.step = "hora";
      await typing();
      await client.sendMessage(
        msg.from,
        `Horarios disponiveis: ${horarios.join(", ")}. Escolha um horario (HH:MM).`
      );
      return;
    }

    if (session.step === "hora") {
      if (!horariosRegex.test(texto)) {
        await typing();
        await client.sendMessage(msg.from, "Horario invalido. Use HH:MM.");
        return;
      }
      session.hora = texto;
      session.step = "nome";
      await typing();
      await client.sendMessage(msg.from, "Qual e o seu nome completo?");
      return;
    }

    if (session.step === "nome") {
      session.nome = textoOriginal;
      session.step = "telefone";
      await typing();
      await client.sendMessage(msg.from, "Informe seu telefone com DDD.");
      return;
    }

    if (session.step === "telefone") {
      const telefone = textoOriginal.replace(/\D/g, "");
      if (telefone.length < 10) {
        await typing();
        await client.sendMessage(msg.from, "Telefone invalido. Envie com DDD.");
        return;
      }
      session.telefone = telefone;
      session.step = "servico";
      await typing();
      await client.sendMessage(
        msg.from,
        `Qual servico deseja? Opcoes: ${servicos.join(", ")}.`
      );
      return;
    }

    if (session.step === "servico") {
      session.servico = textoOriginal;
      const payload = {
        barbeariaId: BARBEARIA_ID,
        nome: session.nome,
        telefone: session.telefone,
        data: session.data,
        hora: session.hora,
        servico: session.servico
      };
      const agendamento = await apiRequest("/agendar", "POST", payload);
      session.step = "menu";
      await typing();
      await client.sendMessage(
        msg.from,
        `Agendamento confirmado para ${agendamento.data} as ${agendamento.hora}.`
      );
      return;
    }
  } catch (erro) {
    console.log("ERRO:", erro);
  }
});

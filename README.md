# Sistema de Agendamentos para Barbearia

Este projeto possui 3 camadas principais:

1. API / Backend (`backend`)
2. Painel Admin (`frontend`)
3. Integracao com chatbot via API (`backend/src/integrations/chatbotAdapter.js`)

## Backend

- Tecnologias: Node.js + Express + PostgreSQL
- Endpoints principais:
  - `GET /horarios-disponiveis?data=YYYY-MM-DD`
  - `POST /agendar`
  - `GET /agendamentos`
  - `DELETE /agendamento/:id`
  - `PUT /agendamento/:id`
  - `POST /horarios`
  - `GET /relatorios/resumo`

Configurar variaveis:

```
cp backend/.env.example backend/.env
```

Schema do banco:

- `backend/src/sql/schema.sql`

## Frontend (Painel Admin)

- React + TailwindCSS
- Telas: login, dashboard, agenda e horarios.
- Configure `frontend/.env` com `VITE_API_URL`.

## Integracao com Chatbot

O arquivo `backend/src/integrations/chatbotAdapter.js` recebe o webhook.
Substitua a logica pelo codigo do seu chatbot quando estiver pronto.

## Chatbot WhatsApp (opcional)

O chatbot foi preparado em `chatbot/robo.js` usando a base enviada por voce.
Ele conversa com a API para buscar horarios e criar agendamentos.

Variaveis:
- `chatbot/.env`: `API_URL`, `BARBEARIA_ID`, `PORT`
- `backend/.env`: `CHATBOT_WEBHOOK_URL` pode apontar para `http://localhost:3000/webhook`

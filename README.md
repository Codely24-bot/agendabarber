# Sistema de Agendamentos para Barbearia

Este projeto possui 3 camadas principais:

1. API / Backend (`backend`)
2. Painel Admin (`frontend`)
3. Integracao com chatbot via API (`backend/src/integrations/chatbotAdapter.js`)

## Deploy no Railway

O repositório foi preparado para deploy pelo root no Railway.

- Build command: `npm run build`
- Start command: `npm start`
- Node: `20.x` via `.nvmrc`

### Variaveis recomendadas no Railway

- `PORT`: definido automaticamente pelo Railway
- `DATABASE_URL`: connection string do Postgres/Supabase
- `DATABASE_SSL`: `true`
- `ADMIN_USER`: usuario do painel
- `ADMIN_PASS`: senha do painel
- `BARBEARIA_ID`: identificador da barbearia, ex. `default`
- `BARBEARIA_NOME`: nome exibido no sistema
- `API_URL`: URL publica da aplicacao, ex. `https://seu-app.railway.app`
- `CHATBOT_WEBHOOK_URL`: opcional, URL do webhook do chatbot
- `CHATBOT_ENABLED`: `false` por padrao no Railway

Arquivos de exemplo para deploy:

- `.env.railway.app.example`: servico principal no Railway
- `.env.railway.chatbot.example`: chatbot WhatsApp em servico separado e opcional

### Observacoes de deploy

- O frontend e compilado no build e servido pelo backend em producao.
- O frontend usa a mesma origem da aplicacao por padrao, entao `VITE_API_URL` pode ficar vazio.
- O modulo de WhatsApp foi deixado opcional no servidor para evitar falhas de deploy em ambientes sem Chromium/sessao persistente.
- Se quiser executar o chatbot no Railway, use um servico separado e habilite `CHATBOT_ENABLED=true` apenas em ambiente compativel.

## Backend

- Tecnologias: Node.js + Express + PostgreSQL
- Compatível com Supabase Postgres via `DATABASE_URL`
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

Para usar com Supabase:

1. Copie a connection string do projeto no painel do Supabase
2. Preencha `DATABASE_URL` em `backend/.env`
3. Rode o schema no banco:

```
cd backend
npm run db:apply-schema
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

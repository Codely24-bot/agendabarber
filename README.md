# Sistema de Agendamentos para Barbearia

Este projeto possui 3 camadas principais:

1. API / Backend (`backend`)
2. Painel Admin (`frontend`)
3. Integracao com chatbot via API (`backend/src/integrations/chatbotAdapter.js`)

## Deploy no Railway

O repositorio foi preparado para deploy pelo root no Railway.

- Build command: `npm run build`
- Start command: `npm start`
- Node: `20.x` via `.nvmrc`
- Healthcheck: `/health`

Arquivos de exemplo para deploy:

- `.env.railway.app.example`: servico principal no Railway
- `.env.railway.chatbot.example`: chatbot WhatsApp em servico separado e opcional

### Checklist de deploy

1. Crie um servico no Railway apontando para a raiz do repositorio.
2. Configure as variaveis com base em `.env.railway.app.example`.
3. Em `DATABASE_URL`, use a URI real de `Connection Pooling` do Supabase.
4. Nao use `db.<projeto>.supabase.co` no Railway.
5. Defina `API_URL` com `https://`.
6. Faca o deploy.
7. Verifique `https://seu-app.up.railway.app/health`.

### Variaveis recomendadas no Railway

- `PORT`: definido automaticamente pelo Railway
- `DATABASE_URL`: URI do pooler do Supabase
- `DATABASE_SSL`: `true`
- `DATABASE_POOL_MAX`: `10`
- `DATABASE_CONNECTION_TIMEOUT_MS`: `15000`
- `DATABASE_IDLE_TIMEOUT_MS`: `30000`
- `ADMIN_USER`: usuario do painel
- `ADMIN_PASS`: senha do painel
- `BARBEARIA_ID`: identificador da barbearia, ex. `default`
- `BARBEARIA_NOME`: nome exibido no sistema
- `API_URL`: URL publica da aplicacao, ex. `https://seu-app.railway.app`
- `CHATBOT_WEBHOOK_URL`: opcional, URL do webhook do chatbot
- `CHATBOT_ENABLED`: `false` por padrao no Railway

### Observacoes de deploy

- O frontend e compilado no build e servido pelo backend em producao.
- O frontend usa a mesma origem da aplicacao por padrao, entao `VITE_API_URL` pode ficar vazio.
- O backend aplica o schema automaticamente ao iniciar.
- O backend valida as variaveis criticas e falha cedo com mensagens mais claras de configuracao.
- O modulo de WhatsApp foi deixado opcional no servidor para evitar falhas de deploy em ambientes sem Chromium ou sessao persistente.
- Se quiser executar o chatbot no Railway, use um servico separado e habilite `CHATBOT_ENABLED=true` apenas em ambiente compativel.

## Backend

- Tecnologias: Node.js + Express + PostgreSQL
- Compativel com Supabase Postgres via `DATABASE_URL`
- Endpoints principais:
  - `GET /health`
  - `GET /horarios-disponiveis?data=YYYY-MM-DD`
  - `POST /agendar`
  - `GET /agendamentos`
  - `DELETE /agendamento/:id`
  - `PUT /agendamento/:id`
  - `POST /horarios`
  - `GET /relatorios/resumo`

Para usar com Supabase localmente:

1. Preencha `backend/.env`.
2. Use a connection string correta do Supabase.
3. Rode `npm run db:apply-schema --workspace backend` se quiser aplicar manualmente.

Schema do banco:

- `backend/src/sql/schema.sql`

## Frontend

- React + TailwindCSS
- Telas: login, dashboard, agenda, horarios e servicos
- `VITE_API_URL` pode ficar vazio quando frontend e backend estao no mesmo servico

## Integracao com Chatbot

O arquivo `backend/src/integrations/chatbotAdapter.js` recebe o webhook.
Substitua a logica pelo codigo do seu chatbot quando estiver pronto.

## Chatbot WhatsApp

O chatbot foi preparado em `chatbot/robo.js` usando a base enviada por voce.
Ele conversa com a API para buscar horarios e criar agendamentos.

Variaveis:

- `chatbot/.env`: `API_URL`, `BARBEARIA_ID`, `PORT`, `ADMIN_PASS`
- `backend/.env`: `CHATBOT_WEBHOOK_URL` pode apontar para `http://localhost:3000/webhook`

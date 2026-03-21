CREATE TABLE IF NOT EXISTS barbearias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL
);

INSERT INTO barbearias (id, nome)
VALUES ('default', 'Barbearia Principal')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS servicos (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  duracao INTEGER NOT NULL,
  preco NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS horarios (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  disponivel BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS agendamentos (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data DATE NOT NULL,
  hora TEXT NOT NULL,
  servico TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmado',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos_assinatura (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  cortes_inclusos INTEGER NOT NULL,
  validade_dias INTEGER NOT NULL DEFAULT 30,
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes_assinatura (
  id SERIAL PRIMARY KEY,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  plano_id INTEGER NOT NULL REFERENCES planos_assinatura(id),
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  data_adesao DATE NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento DATE NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pendente',
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagamentos_assinatura (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  valor NUMERIC(10,2) NOT NULL,
  competencia TEXT NOT NULL,
  data_pagamento DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pago',
  metodo TEXT NOT NULL DEFAULT 'manual',
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consumos_assinatura (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes_assinatura(id) ON DELETE CASCADE,
  barbearia_id TEXT NOT NULL REFERENCES barbearias(id),
  data_consumo DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL DEFAULT 'Corte',
  quantidade INTEGER NOT NULL DEFAULT 1,
  agendamento_id INTEGER REFERENCES agendamentos(id) ON DELETE SET NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);
CREATE INDEX IF NOT EXISTS idx_planos_assinatura_barbearia ON planos_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_assinatura_barbearia ON clientes_assinatura(barbearia_id);
CREATE INDEX IF NOT EXISTS idx_clientes_assinatura_vencimento ON clientes_assinatura(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_pagamentos_assinatura_cliente ON pagamentos_assinatura(cliente_id);
CREATE INDEX IF NOT EXISTS idx_consumos_assinatura_cliente ON consumos_assinatura(cliente_id);

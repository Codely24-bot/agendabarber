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

CREATE INDEX IF NOT EXISTS idx_horarios_data ON horarios(data);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data);

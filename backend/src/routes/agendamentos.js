import express from "express";
import { z } from "zod";
import { pool, query } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  sendChatbotCompletionThanks,
  sendChatbotConfirmation
} from "../integrations/chatbotAdapter.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureDefaultServices } from "../services/serviceCatalog.js";

const router = express.Router();

const agendarSchema = z.object({
  barbeariaId: z.string().optional(),
  nome: z.string(),
  telefone: z.string(),
  data: z.string(),
  hora: z.string(),
  servico: z.string()
});

async function ensureServiceExists(client, servico, barbeariaId) {
  const serviceResult = await client.query(
    `
      SELECT id
      FROM servicos
      WHERE barbearia_id = $1
        AND nome = $2
      LIMIT 1
    `,
    [barbeariaId, servico]
  );

  return serviceResult.rows.length > 0;
}

router.post("/agendar", asyncHandler(async (req, res) => {
  const parsed = agendarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.flatten() });
  }

  const { barbeariaId, nome, telefone, data, hora, servico } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const currentBarbershop = barbeariaId || "default";
    await ensureDefaultServices(currentBarbershop);
    const serviceExists = await ensureServiceExists(client, servico, currentBarbershop);

    if (!serviceExists) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Servico nao cadastrado no catalogo" });
    }

    const disponibilidade = await client.query(
      `
        SELECT h.id
        FROM horarios h
        LEFT JOIN agendamentos a
          ON a.data = h.data
         AND a.hora = h.hora
         AND a.status != 'cancelado'
         AND a.barbearia_id = h.barbearia_id
        WHERE h.data = $1
          AND h.hora = $2
          AND h.disponivel = true
          AND h.barbearia_id = $3
          AND a.id IS NULL
        LIMIT 1
      `,
      [data, hora, currentBarbershop]
    );

    if (disponibilidade.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Horario indisponivel" });
    }

    const inserted = await client.query(
      `
        INSERT INTO agendamentos
          (barbearia_id, nome, telefone, data, hora, servico, status)
        VALUES
          ($1, $2, $3, $4, $5, $6, 'confirmado')
        RETURNING *
      `,
      [currentBarbershop, nome, telefone, data, hora, servico]
    );

    await client.query(
      `
        UPDATE horarios
        SET disponivel = false
        WHERE data = $1 AND hora = $2 AND barbearia_id = $3
      `,
      [data, hora, currentBarbershop]
    );

    await client.query("COMMIT");
    const agendamento = inserted.rows[0];
    try {
      await sendChatbotConfirmation(agendamento);
    } catch (error) {
      // Falha de webhook nao deve quebrar o agendamento.
    }
    return res.status(201).json(agendamento);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Falha ao agendar" });
  } finally {
    client.release();
  }
}));

router.get("/agendamentos", requireAdmin, asyncHandler(async (req, res) => {
  const { data, barbeariaId } = req.query;
  const result = await query(
    `
      SELECT *
      FROM agendamentos
      WHERE ($1::date IS NULL OR data = $1::date)
        AND barbearia_id = COALESCE($2, barbearia_id)
      ORDER BY data ASC, hora ASC
    `,
    [data || null, barbeariaId || null]
  );

  return res.json(result.rows);
}));

router.put("/agendamento/:id", requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, servico, data, hora } = req.body || {};
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const atual = await client.query(
      `
        SELECT *
        FROM agendamentos
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

    if (!atual.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Agendamento nao encontrado" });
    }

    const agendamentoAtual = atual.rows[0];
    await ensureDefaultServices(agendamentoAtual.barbearia_id);
    const novoServico = servico || agendamentoAtual.servico;
    const serviceExists = await ensureServiceExists(
      client,
      novoServico,
      agendamentoAtual.barbearia_id
    );

    if (!serviceExists) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Servico nao cadastrado no catalogo" });
    }

    const novaData = data || agendamentoAtual.data;
    const novaHora = hora || agendamentoAtual.hora;
    const mudouSlot =
      String(novaData) !== String(agendamentoAtual.data) ||
      String(novaHora) !== String(agendamentoAtual.hora);

    if (mudouSlot) {
      const disponibilidade = await client.query(
        `
          SELECT h.id
          FROM horarios h
          LEFT JOIN agendamentos a
            ON a.data = h.data
           AND a.hora = h.hora
           AND a.status != 'cancelado'
           AND a.barbearia_id = h.barbearia_id
           AND a.id != $4
          WHERE h.data = $1
            AND h.hora = $2
            AND h.barbearia_id = $3
            AND h.disponivel = true
            AND a.id IS NULL
          LIMIT 1
        `,
        [novaData, novaHora, agendamentoAtual.barbearia_id, id]
      );

      if (!disponibilidade.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Novo horario indisponivel" });
      }

      await client.query(
        `
          UPDATE horarios
          SET disponivel = true
          WHERE data = $1 AND hora = $2 AND barbearia_id = $3
        `,
        [agendamentoAtual.data, agendamentoAtual.hora, agendamentoAtual.barbearia_id]
      );

      await client.query(
        `
          UPDATE horarios
          SET disponivel = false
          WHERE data = $1 AND hora = $2 AND barbearia_id = $3
        `,
        [novaData, novaHora, agendamentoAtual.barbearia_id]
      );
    }

    const result = await client.query(
      `
        UPDATE agendamentos
        SET status = COALESCE($1, status),
            servico = COALESCE($2, servico),
            data = COALESCE($3, data),
            hora = COALESCE($4, hora)
        WHERE id = $5
        RETURNING *
      `,
      [status || null, servico || null, data || null, hora || null, id]
    );

    await client.query("COMMIT");
    return res.json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Falha ao atualizar agendamento" });
  } finally {
    client.release();
  }
}));

router.delete("/agendamento/:id", requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        UPDATE agendamentos
        SET status = 'cancelado'
        WHERE id = $1
        RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Agendamento nao encontrado" });
    }

    const agendamento = result.rows[0];

    await client.query(
      `
        UPDATE horarios
        SET disponivel = true
        WHERE data = $1 AND hora = $2 AND barbearia_id = $3
      `,
      [agendamento.data, agendamento.hora, agendamento.barbearia_id]
    );

    await client.query("COMMIT");
    return res.json(agendamento);
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(500).json({ error: "Falha ao cancelar agendamento" });
  } finally {
    client.release();
  }
}));

router.post("/agendamento/:id/concluir", requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await query(
    `
      UPDATE agendamentos
      SET status = 'concluido'
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  if (!result.rows.length) {
    return res.status(404).json({ error: "Agendamento nao encontrado" });
  }

  const agendamento = result.rows[0];

  try {
    await sendChatbotCompletionThanks(agendamento);
  } catch (error) {
    // Falha no envio da mensagem nao deve quebrar a conclusao.
  }

  return res.json(agendamento);
}));

export default router;

import express from "express";
import { z } from "zod";
import { pool, query } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendChatbotConfirmation } from "../integrations/chatbotAdapter.js";

const router = express.Router();

const agendarSchema = z.object({
  barbeariaId: z.string().optional(),
  nome: z.string(),
  telefone: z.string(),
  data: z.string(),
  hora: z.string(),
  servico: z.string()
});

router.post("/agendar", async (req, res) => {
  const parsed = agendarSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.flatten() });
  }

  const { barbeariaId, nome, telefone, data, hora, servico } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
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
      [data, hora, barbeariaId || "default"]
    );

    if (disponibilidade.rows.length === 0) {
      await query("ROLLBACK");
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
      [barbeariaId || "default", nome, telefone, data, hora, servico]
    );

    await client.query(
      `
        UPDATE horarios
        SET disponivel = false
        WHERE data = $1 AND hora = $2 AND barbearia_id = $3
      `,
      [data, hora, barbeariaId || "default"]
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
});

router.get("/agendamentos", requireAdmin, async (req, res) => {
  const { data, barbeariaId } = req.query;
  const result = await query(
    `
      SELECT *
      FROM agendamentos
      WHERE ($1::text IS NULL OR data = $1)
        AND barbearia_id = COALESCE($2, barbearia_id)
      ORDER BY data ASC, hora ASC
    `,
    [data || null, barbeariaId || null]
  );

  return res.json(result.rows);
});

router.put("/agendamento/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, servico, data, hora } = req.body || {};
  const result = await query(
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

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Agendamento nao encontrado" });
  }

  return res.json(result.rows[0]);
});

router.delete("/agendamento/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const result = await query(
    `
      UPDATE agendamentos
      SET status = 'cancelado'
      WHERE id = $1
      RETURNING *
    `,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Agendamento nao encontrado" });
  }

  return res.json(result.rows[0]);
});

export default router;

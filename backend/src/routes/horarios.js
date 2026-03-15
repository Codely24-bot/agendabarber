import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const horariosSchema = z.object({
  barbeariaId: z.string().optional(),
  data: z.string(),
  hora: z.string()
});

router.get("/horarios-disponiveis", async (req, res) => {
  const { data, barbeariaId } = req.query;
  if (!data) {
    return res.status(400).json({ error: "Parametro data e obrigatorio" });
  }

  const result = await query(
    `
      SELECT h.hora
      FROM horarios h
      LEFT JOIN agendamentos a
        ON a.data = h.data
       AND a.hora = h.hora
       AND a.status != 'cancelado'
       AND a.barbearia_id = h.barbearia_id
      WHERE h.data = $1
        AND h.disponivel = true
        AND h.barbearia_id = COALESCE($2, h.barbearia_id)
        AND a.id IS NULL
      ORDER BY h.hora ASC
    `,
    [data, barbeariaId || null]
  );

  return res.json(result.rows.map((row) => row.hora));
});

router.post("/horarios", requireAdmin, async (req, res) => {
  const parsed = horariosSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.flatten() });
  }

  const { barbeariaId, data, hora } = parsed.data;
  const result = await query(
    `
      INSERT INTO horarios (barbearia_id, data, hora, disponivel)
      VALUES ($1, $2, $3, true)
      RETURNING *
    `,
    [barbeariaId || "default", data, hora]
  );

  return res.status(201).json(result.rows[0]);
});

export default router;

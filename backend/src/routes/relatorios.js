import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { query } from "../db.js";

const router = express.Router();

router.get("/relatorios/resumo", requireAdmin, async (req, res) => {
  const { data, barbeariaId } = req.query;
  const result = await query(
    `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE a.status = 'confirmado') AS confirmados,
        COUNT(*) FILTER (WHERE a.status = 'cancelado') AS cancelados,
        COUNT(*) FILTER (WHERE a.status = 'concluido') AS concluidos,
        COALESCE(SUM(s.preco), 0) AS faturamento_estimado
      FROM agendamentos a
      LEFT JOIN servicos s
        ON s.nome = a.servico
       AND s.barbearia_id = a.barbearia_id
      WHERE ($1::text IS NULL OR a.data = $1)
        AND a.barbearia_id = COALESCE($2, a.barbearia_id)
    `,
    [data || null, barbeariaId || null]
  );

  return res.json(result.rows[0]);
});

export default router;

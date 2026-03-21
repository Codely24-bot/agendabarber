import express from "express";
import { z } from "zod";
import { query } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DEFAULT_BARBERSHOP_ID } from "../config.js";

const router = express.Router();
const WEEKLY_SLOTS = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00"
];
const ALLOWED_WEEK_DAYS = [2, 3, 4, 5, 6];

const horariosSchema = z.object({
  barbeariaId: z.string().optional(),
  data: z.string(),
  hora: z.string()
});

const gerarSemanaSchema = z.object({
  barbeariaId: z.string().optional(),
  dataInicial: z.string().optional()
});

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value) {
  return new Date(`${value}T00:00:00`);
}

function getStartDate(baseDate = new Date()) {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);

  while (!ALLOWED_WEEK_DAYS.includes(date.getDay())) {
    date.setDate(date.getDate() + 1);
  }

  return date;
}

function buildWeeklyDates(startDateValue) {
  const startDate = getStartDate(startDateValue ? toDateOnly(startDateValue) : new Date());
  const dates = [];

  for (let offset = 0; dates.length < ALLOWED_WEEK_DAYS.length; offset += 1) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + offset);

    if (ALLOWED_WEEK_DAYS.includes(current.getDay())) {
      dates.push(formatDate(current));
    }
  }

  return dates;
}

router.get("/horarios-disponiveis", asyncHandler(async (req, res) => {
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
}));

router.get("/dias-disponiveis", asyncHandler(async (req, res) => {
  const { dataInicial, barbeariaId } = req.query;
  const datas = buildWeeklyDates(
    typeof dataInicial === "string" && dataInicial ? dataInicial : undefined
  );

  const result = await query(
    `
      SELECT
        h.data,
        COUNT(*) FILTER (WHERE h.disponivel = true AND a.id IS NULL) AS disponiveis
      FROM horarios h
      LEFT JOIN agendamentos a
        ON a.data = h.data
       AND a.hora = h.hora
       AND a.status != 'cancelado'
       AND a.barbearia_id = h.barbearia_id
      WHERE h.data = ANY($1::date[])
        AND h.barbearia_id = COALESCE($2, h.barbearia_id)
      GROUP BY h.data
      ORDER BY h.data ASC
    `,
    [datas, barbeariaId || null]
  );

  const disponibilidadePorData = new Map(
    result.rows.map((row) => [formatDate(new Date(row.data)), Number(row.disponiveis)])
  );

  return res.json(
    datas
      .map((data) => ({
        data,
        disponiveis: disponibilidadePorData.get(data) || 0
      }))
      .filter((dia) => dia.disponiveis > 0)
  );
}));

router.get("/horarios", requireAdmin, asyncHandler(async (req, res) => {
  const { dataInicial, dataFinal, barbeariaId } = req.query;
  const result = await query(
    `
      SELECT h.*
      FROM horarios h
      WHERE ($1::date IS NULL OR h.data >= $1)
        AND ($2::date IS NULL OR h.data <= $2)
        AND h.barbearia_id = COALESCE($3, h.barbearia_id)
      ORDER BY h.data ASC, h.hora ASC
    `,
    [dataInicial || null, dataFinal || null, barbeariaId || null]
  );

  return res.json(result.rows);
}));

router.post("/horarios", requireAdmin, asyncHandler(async (req, res) => {
  const parsed = horariosSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.flatten() });
  }

  const { barbeariaId, data, hora } = parsed.data;
  const result = await query(
    `
      INSERT INTO horarios (barbearia_id, data, hora, disponivel)
      SELECT $1, $2, $3, true
      WHERE NOT EXISTS (
        SELECT 1
        FROM horarios
        WHERE barbearia_id = $1
          AND data = $2
          AND hora = $3
      )
      RETURNING *
    `,
    [barbeariaId || DEFAULT_BARBERSHOP_ID, data, hora]
  );

  if (!result.rows.length) {
    return res.status(409).json({ error: "Horario ja existe" });
  }

  return res.status(201).json(result.rows[0]);
}));

router.post("/horarios/gerar-semana", requireAdmin, asyncHandler(async (req, res) => {
  const parsed = gerarSemanaSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ error: "Dados invalidos", details: parsed.error.flatten() });
  }

  const { barbeariaId, dataInicial } = parsed.data;
  const datas = buildWeeklyDates(dataInicial);
  const inserted = [];

  for (const data of datas) {
    for (const hora of WEEKLY_SLOTS) {
      const result = await query(
        `
          INSERT INTO horarios (barbearia_id, data, hora, disponivel)
          SELECT $1, $2, $3, true
          WHERE NOT EXISTS (
            SELECT 1
            FROM horarios
            WHERE barbearia_id = $1
              AND data = $2
              AND hora = $3
          )
          RETURNING *
        `,
        [barbeariaId || DEFAULT_BARBERSHOP_ID, data, hora]
      );

      if (result.rows[0]) {
        inserted.push(result.rows[0]);
      }
    }
  }

  return res.status(201).json({
    inserted: inserted.length,
    datas,
    horarios: inserted
  });
}));

export default router;

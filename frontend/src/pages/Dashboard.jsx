import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [freeSlots, setFreeSlots] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const today = getToday();
      setError("");

      try {
        const [resumo, agendamentos, horariosDisponiveis] = await Promise.all([
          apiFetch(`/relatorios/resumo?data=${encodeURIComponent(today)}`),
          apiFetch(`/agendamentos?data=${encodeURIComponent(today)}`),
          apiFetch(`/horarios-disponiveis?data=${encodeURIComponent(today)}`)
        ]);

        setSummary(resumo);
        setFreeSlots(horariosDisponiveis.length);
        setTotalClients(new Set(agendamentos.map((item) => item.telefone)).size);
      } catch (err) {
        setError(err.message);
      }
    }

    loadDashboard();
  }, []);

  const cards = [
    { label: "Agendamentos do dia", value: summary?.total || "0" },
    { label: "Total de clientes", value: totalClients },
    { label: "Horarios livres", value: freeSlots },
    {
      label: "Faturamento estimado",
      value: `R$ ${Number(summary?.faturamento_estimado || 0).toFixed(2)}`
    }
  ];

  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Resumo do dia" subtitle="Dashboard" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="glass rounded-3xl p-6 shadow-soft">
            <p className="text-sm uppercase tracking-[0.2em] text-ink/60">
              {card.label}
            </p>
            <h3 className="font-display text-2xl mt-4">{card.value}</h3>
          </div>
        ))}
      </div>
      <div className="glass rounded-3xl p-8 shadow-soft">
        <h3 className="font-display text-xl">Highlights</h3>
        <div className="grid gap-6 md:grid-cols-3 mt-6">
          <div className="bg-white/60 rounded-2xl p-5 border border-ink/5">
            <p className="text-sm text-ink/60">Confirmados</p>
            <p className="font-medium mt-2">{summary?.confirmados || 0}</p>
          </div>
          <div className="bg-white/60 rounded-2xl p-5 border border-ink/5">
            <p className="text-sm text-ink/60">Cancelados</p>
            <p className="font-medium mt-2">{summary?.cancelados || 0}</p>
          </div>
          <div className="bg-white/60 rounded-2xl p-5 border border-ink/5">
            <p className="text-sm text-ink/60">Concluidos</p>
            <p className="font-medium mt-2">{summary?.concluidos || 0}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

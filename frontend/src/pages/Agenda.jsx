import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const CHATBOT_QR_URL = import.meta.env.VITE_CHATBOT_URL || "/qr";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function formatDateLabel(date) {
  const [year, month, day] = String(date).slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

export default function Agenda() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAgendamentos() {
    setLoading(true);
    setError("");

    try {
      const response = await apiFetch(
        `/agendamentos?data=${encodeURIComponent(selectedDate)}`
      );
      setAgendamentos(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgendamentos();
  }, [selectedDate]);

  async function handleNewAppointment() {
    const nome = window.prompt("Nome do cliente:");
    if (!nome) return;

    const telefone = window.prompt("Telefone com DDD:");
    if (!telefone) return;

    const data = window.prompt("Data do agendamento (YYYY-MM-DD):", selectedDate);
    if (!data) return;

    const hora = window.prompt("Hora do agendamento (HH:MM):", "07:00");
    if (!hora) return;

    const servico = window.prompt("Servico:", "Corte");
    if (!servico) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch("/agendar", {
        method: "POST",
        body: JSON.stringify({
          nome,
          telefone,
          data,
          hora,
          servico
        })
      });
      setSuccess(`Agendamento criado para ${formatDateLabel(data)} as ${hora}.`);
      setSelectedDate(data);
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(agendamento) {
    const data = window.prompt(
      "Nova data do agendamento (YYYY-MM-DD):",
      formatDate(agendamento.data)
    );
    if (!data) return;

    const hora = window.prompt("Novo horario (HH:MM):", agendamento.hora);
    if (!hora) return;

    const servico = window.prompt("Novo servico:", agendamento.servico);
    if (!servico) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/agendamento/${agendamento.id}`, {
        method: "PUT",
        body: JSON.stringify({ data, hora, servico })
      });
      setSuccess(`Agendamento ${agendamento.id} atualizado.`);
      setSelectedDate(data);
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel(agendamento) {
    const confirmed = window.confirm(
      `Deseja cancelar o agendamento de ${agendamento.nome} as ${agendamento.hora}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/agendamento/${agendamento.id}`, {
        method: "DELETE"
      });
      setSuccess(`Agendamento ${agendamento.id} cancelado.`);
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleComplete(agendamento) {
    const confirmed = window.confirm(
      `Confirmar que o atendimento de ${agendamento.nome} foi finalizado?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/agendamento/${agendamento.id}/concluir`, {
        method: "POST"
      });
      setSuccess(
        `Atendimento finalizado e mensagem de agradecimento enviada para ${agendamento.nome}.`
      );
      await loadAgendamentos();
    } catch (err) {
      setError(err.message);
    }
  }

  function handleViewClient(agendamento) {
    window.alert(
      `Cliente: ${agendamento.nome}\nTelefone: ${agendamento.telefone}\nServico: ${agendamento.servico}\nData: ${formatDate(
        agendamento.data
      )}\nHora: ${agendamento.hora}\nStatus: ${agendamento.status}`.replace(
        `Data: ${formatDate(agendamento.data)}`,
        `Data: ${formatDateLabel(agendamento.data)}`
      )
    );
  }

  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Agenda diaria" subtitle="Agenda" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
      <div className="glass rounded-3xl p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink/60">
              Visualizacao em tempo real da agenda.
            </p>
            <input
              className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              className="bg-white/80 border border-ink/10 rounded-2xl px-5 py-3 text-sm"
              onClick={() => window.open(CHATBOT_QR_URL, "_blank", "noopener,noreferrer")}
              type="button"
            >
              Gerar QR do WhatsApp
            </button>
            <a
              className="text-xs text-ink/60 underline-offset-4 hover:underline"
              href={CHATBOT_QR_URL}
              target="_blank"
              rel="noreferrer"
            >
              Abrir QR em nova aba
            </a>
            <button
              className="bg-ink text-cream rounded-2xl px-5 py-3 text-sm"
              onClick={handleNewAppointment}
              type="button"
            >
              Novo agendamento
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          {loading ? <p className="text-sm text-ink/60">Carregando agenda...</p> : null}
          {!loading && !agendamentos.length ? (
            <p className="text-sm text-ink/60">Nenhum agendamento para esta data.</p>
          ) : null}
          {!loading && agendamentos.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink/60">
                  <th className="py-3">Hora</th>
                  <th className="py-3">Cliente</th>
                  <th className="py-3">Servico</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {agendamentos.map((row) => (
                  <tr key={row.id} className="border-t border-ink/5">
                    <td className="py-4">{row.hora}</td>
                    <td className="py-4">{row.nome}</td>
                    <td className="py-4">{row.servico}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full bg-mint/40 text-xs">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-4 flex gap-2">
                      {row.status !== "concluido" && row.status !== "cancelado" ? (
                        <button
                          className="px-3 py-2 rounded-xl bg-emerald-600 text-white"
                          onClick={() => handleComplete(row)}
                          type="button"
                        >
                          Finalizar
                        </button>
                      ) : null}
                      <button
                        className="px-3 py-2 rounded-xl bg-white/70 border border-ink/10"
                        onClick={() => handleEdit(row)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl bg-white/70 border border-ink/10"
                        onClick={() => handleCancel(row)}
                        type="button"
                      >
                        Cancelar
                      </button>
                      <button
                        className="px-3 py-2 rounded-xl bg-ink text-cream"
                        onClick={() => handleViewClient(row)}
                        type="button"
                      >
                        Ver cliente
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </section>
  );
}

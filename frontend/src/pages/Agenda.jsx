import Topbar from "../components/Topbar.jsx";

const CHATBOT_QR_URL = import.meta.env.VITE_CHATBOT_URL || "http://localhost:3000/qr";

const rows = [
  { hora: "09:00", cliente: "Lucas Moura", servico: "Corte + Barba", status: "confirmado" },
  { hora: "10:00", cliente: "Bruna Dias", servico: "Corte classico", status: "confirmado" },
  { hora: "11:00", cliente: "Mateus Lima", servico: "Barba premium", status: "pendente" },
  { hora: "14:00", cliente: "Joao Silva", servico: "Corte degradê", status: "confirmado" }
];

export default function Agenda() {
  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Agenda diaria" subtitle="Agenda" />
      <div className="glass rounded-3xl p-8 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-ink/60">
            Visualizacao em tempo real da agenda.
          </p>
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
            <button className="bg-ink text-cream rounded-2xl px-5 py-3 text-sm">
              Novo agendamento
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
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
              {rows.map((row) => (
                <tr key={row.hora} className="border-t border-ink/5">
                  <td className="py-4">{row.hora}</td>
                  <td className="py-4">{row.cliente}</td>
                  <td className="py-4">{row.servico}</td>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full bg-mint/40 text-xs">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 flex gap-2">
                    <button className="px-3 py-2 rounded-xl bg-white/70 border border-ink/10">
                      Editar
                    </button>
                    <button className="px-3 py-2 rounded-xl bg-white/70 border border-ink/10">
                      Cancelar
                    </button>
                    <button className="px-3 py-2 rounded-xl bg-ink text-cream">
                      Ver cliente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

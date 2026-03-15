import Topbar from "../components/Topbar.jsx";

const slots = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00"
];

export default function Horarios() {
  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Gestao de horarios" subtitle="Horarios" />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="glass rounded-3xl p-8 shadow-soft">
          <h3 className="font-display text-xl">Agenda semanal automatica</h3>
          <p className="text-sm text-ink/60 mt-2">
            Gere horarios padrao de segunda a sexta rapidamente.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            {slots.map((slot) => (
              <span
                key={slot}
                className="px-4 py-2 rounded-full bg-white/70 border border-ink/10 text-sm"
              >
                {slot}
              </span>
            ))}
          </div>
          <button className="mt-6 bg-ink text-cream rounded-2xl px-5 py-3 text-sm">
            Gerar semana
          </button>
        </div>
        <div className="glass rounded-3xl p-8 shadow-soft">
          <h3 className="font-display text-xl">Criar horario manual</h3>
          <div className="flex flex-col gap-4 mt-6">
            <input
              className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
              placeholder="Data (YYYY-MM-DD)"
            />
            <input
              className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
              placeholder="Hora (HH:MM)"
            />
            <button className="bg-ink text-cream rounded-2xl py-3 text-sm">
              Criar horario
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

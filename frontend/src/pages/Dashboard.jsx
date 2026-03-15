import Topbar from "../components/Topbar.jsx";

const cards = [
  { label: "Agendamentos do dia", value: "18" },
  { label: "Total de clientes", value: "248" },
  { label: "Horarios livres", value: "7" },
  { label: "Faturamento estimado", value: "R$ 2.340" }
];

export default function Dashboard() {
  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Resumo do dia" subtitle="Dashboard" />
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
            <p className="text-sm text-ink/60">Servico mais vendido</p>
            <p className="font-medium mt-2">Corte classico</p>
          </div>
          <div className="bg-white/60 rounded-2xl p-5 border border-ink/5">
            <p className="text-sm text-ink/60">Horario pico</p>
            <p className="font-medium mt-2">18:00 - 20:00</p>
          </div>
          <div className="bg-white/60 rounded-2xl p-5 border border-ink/5">
            <p className="text-sm text-ink/60">Satisfacao</p>
            <p className="font-medium mt-2">4.9 / 5</p>
          </div>
        </div>
      </div>
    </section>
  );
}

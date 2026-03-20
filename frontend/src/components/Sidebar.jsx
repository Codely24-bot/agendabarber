import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/agenda", label: "Agenda" },
  { to: "/horarios", label: "Horarios" },
  { to: "/servicos", label: "Servicos" }
];

export default function Sidebar() {
  return (
    <aside className="glass shadow-soft rounded-3xl p-6 flex flex-col gap-8">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-ink/60">Barbearia Pro</p>
        <h1 className="font-display text-2xl mt-2">Painel Admin</h1>
      </div>
      <nav className="flex flex-col gap-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `px-4 py-3 rounded-2xl text-sm font-medium transition ${
                isActive ? "bg-ink text-cream" : "bg-white/50 hover:bg-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto text-xs text-ink/60">
        Multi-barbearias pronto para SaaS
      </div>
    </aside>
  );
}

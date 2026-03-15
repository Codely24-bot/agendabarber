export default function Topbar({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm uppercase tracking-[0.3em] text-ink/60">{subtitle}</p>
      <h2 className="font-display text-3xl">{title}</h2>
    </div>
  );
}

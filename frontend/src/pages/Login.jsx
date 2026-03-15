import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api.js";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form)
      });
      localStorage.setItem("admin_token", data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="glass rounded-3xl p-10 w-full max-w-md shadow-soft">
        <h1 className="font-display text-3xl">Bem-vindo de volta</h1>
        <p className="text-sm text-ink/60 mt-2">
          Acesse seu painel administrativo da barbearia.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <input
            className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
            placeholder="Usuario"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
          <input
            className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
            placeholder="Senha"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button className="bg-ink text-cream rounded-2xl py-3 font-medium">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

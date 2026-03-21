import { useEffect, useState } from "react";
import Topbar from "../components/Topbar.jsx";
import { apiFetch } from "../api.js";

const defaultPlanForm = {
  nome: "",
  valor: "",
  cortesInclusos: "4",
  validadeDias: "30"
};

const defaultSubscriberForm = {
  nome: "",
  telefone: "",
  planoId: "",
  statusPagamento: "pendente",
  observacoes: ""
};

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatDate(value) {
  return String(value || "").slice(0, 10);
}

export default function Assinaturas() {
  const [summary, setSummary] = useState(null);
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [planForm, setPlanForm] = useState(defaultPlanForm);
  const [subscriberForm, setSubscriberForm] = useState(defaultSubscriberForm);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingSubscriber, setSavingSubscriber] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData(currentStatus = statusFilter) {
    setLoading(true);
    setError("");

    try {
      const [summaryResponse, plansResponse, clientsResponse] = await Promise.all([
        apiFetch("/assinaturas/resumo"),
        apiFetch("/assinaturas/planos"),
        apiFetch(
          `/assinaturas/clientes${
            currentStatus ? `?status=${encodeURIComponent(currentStatus)}` : ""
          }`
        )
      ]);

      setSummary(summaryResponse);
      setPlans(plansResponse);
      setClients(clientsResponse);
      setSubscriberForm((current) => ({
        ...current,
        planoId: current.planoId || String(plansResponse[0]?.id || "")
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData(statusFilter);
  }, [statusFilter]);

  async function handleCreatePlan(event) {
    event.preventDefault();
    setSavingPlan(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/assinaturas/planos", {
        method: "POST",
        body: JSON.stringify({
          nome: planForm.nome,
          valor: Number(planForm.valor),
          cortesInclusos: Number(planForm.cortesInclusos),
          validadeDias: Number(planForm.validadeDias)
        })
      });
      setPlanForm(defaultPlanForm);
      setSuccess("Plano de assinatura cadastrado com sucesso.");
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleCreateSubscriber(event) {
    event.preventDefault();
    setSavingSubscriber(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/assinaturas/clientes", {
        method: "POST",
        body: JSON.stringify({
          nome: subscriberForm.nome,
          telefone: subscriberForm.telefone,
          planoId: Number(subscriberForm.planoId),
          statusPagamento: subscriberForm.statusPagamento,
          observacoes: subscriberForm.observacoes || undefined
        })
      });
      setSubscriberForm((current) => ({
        ...defaultSubscriberForm,
        planoId: current.planoId
      }));
      setSuccess("Assinante cadastrado com sucesso.");
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingSubscriber(false);
    }
  }

  async function handleRegisterPayment(client) {
    const competencia = window.prompt("Competencia do pagamento (ex.: 2026-03):");
    if (!competencia) return;

    const valor = window.prompt(
      "Valor pago:",
      String(client.plano_valor || "")
    );
    if (!valor) return;

    setError("");
    setSuccess("");

    try {
      await apiFetch(`/assinaturas/clientes/${client.id}/pagamentos`, {
        method: "POST",
        body: JSON.stringify({
          competencia,
          valor: Number(valor),
          status: "pago"
        })
      });
      setSuccess(`Pagamento registrado para ${client.nome}.`);
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRegisterCut(client) {
    setError("");
    setSuccess("");

    try {
      await apiFetch(`/assinaturas/clientes/${client.id}/consumos`, {
        method: "POST",
        body: JSON.stringify({
          descricao: "Corte",
          quantidade: 1
        })
      });
      setSuccess(`Consumo de corte registrado para ${client.nome}.`);
      await loadData(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  const cards = [
    { label: "Assinantes ativos", value: summary?.total_ativos || 0 },
    { label: "Pagamentos em dia", value: summary?.pagamentos_em_dia || 0 },
    { label: "Vencendo na semana", value: summary?.vencendo_semana || 0 },
    {
      label: "Receita mensal prevista",
      value: formatCurrency(summary?.receita_recorrente || 0)
    }
  ];

  return (
    <section className="flex flex-col gap-10">
      <Topbar title="Assinaturas e cortes mensais" subtitle="Assinaturas" />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
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
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-3xl p-8 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-xl">Mensalistas</h3>
              <p className="text-sm text-ink/60 mt-2">
                Acompanhe nome do cliente, vencimento e status de pagamento.
              </p>
            </div>
            <select
              className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="atrasado">Atrasado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          {loading ? <p className="text-sm text-ink/60 mt-6">Carregando assinaturas...</p> : null}
          {!loading && !clients.length ? (
            <p className="text-sm text-ink/60 mt-6">Nenhum assinante encontrado.</p>
          ) : null}
          {!loading && clients.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink/60">
                    <th className="py-3">Cliente</th>
                    <th className="py-3">Plano</th>
                    <th className="py-3">Vencimento</th>
                    <th className="py-3">Pagamento</th>
                    <th className="py-3">Cortes</th>
                    <th className="py-3">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-t border-ink/5 align-top">
                      <td className="py-4">
                        <p>{client.nome}</p>
                        <p className="text-xs text-ink/50">{client.telefone}</p>
                      </td>
                      <td className="py-4">
                        <p>{client.plano_nome}</p>
                        <p className="text-xs text-ink/50">
                          {formatCurrency(client.plano_valor)}
                        </p>
                      </td>
                      <td className="py-4">{formatDate(client.data_vencimento)}</td>
                      <td className="py-4">
                        <span className="px-3 py-1 rounded-full bg-mint/40 text-xs">
                          {client.status_pagamento}
                        </span>
                      </td>
                      <td className="py-4">
                        <p>Usados: {client.cortes_usados_mes}</p>
                        <p className="text-xs text-ink/50">
                          Restantes: {client.cortes_restantes}
                        </p>
                      </td>
                      <td className="py-4 flex flex-col gap-2">
                        <button
                          className="px-3 py-2 rounded-xl bg-ink text-cream"
                          type="button"
                          onClick={() => handleRegisterPayment(client)}
                        >
                          Registrar pagamento
                        </button>
                        <button
                          className="px-3 py-2 rounded-xl bg-white/70 border border-ink/10"
                          type="button"
                          onClick={() => handleRegisterCut(client)}
                        >
                          Registrar corte
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-6">
          <div className="glass rounded-3xl p-8 shadow-soft">
            <h3 className="font-display text-xl">Novo plano</h3>
            <form className="flex flex-col gap-4 mt-6" onSubmit={handleCreatePlan}>
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                placeholder="Nome do plano"
                value={planForm.nome}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, nome: event.target.value }))
                }
              />
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Valor mensal"
                value={planForm.valor}
                onChange={(event) =>
                  setPlanForm((current) => ({ ...current, valor: event.target.value }))
                }
              />
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                type="number"
                min="1"
                placeholder="Cortes inclusos"
                value={planForm.cortesInclusos}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    cortesInclusos: event.target.value
                  }))
                }
              />
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                type="number"
                min="1"
                placeholder="Validade em dias"
                value={planForm.validadeDias}
                onChange={(event) =>
                  setPlanForm((current) => ({
                    ...current,
                    validadeDias: event.target.value
                  }))
                }
              />
              <button
                className="bg-ink text-cream rounded-2xl py-3 text-sm disabled:opacity-60"
                disabled={savingPlan}
              >
                {savingPlan ? "Salvando..." : "Cadastrar plano"}
              </button>
            </form>
          </div>
          <div className="glass rounded-3xl p-8 shadow-soft">
            <h3 className="font-display text-xl">Novo assinante</h3>
            <form className="flex flex-col gap-4 mt-6" onSubmit={handleCreateSubscriber}>
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                placeholder="Nome do cliente"
                value={subscriberForm.nome}
                onChange={(event) =>
                  setSubscriberForm((current) => ({ ...current, nome: event.target.value }))
                }
              />
              <input
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                placeholder="Telefone"
                value={subscriberForm.telefone}
                onChange={(event) =>
                  setSubscriberForm((current) => ({
                    ...current,
                    telefone: event.target.value
                  }))
                }
              />
              <select
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                value={subscriberForm.planoId}
                onChange={(event) =>
                  setSubscriberForm((current) => ({ ...current, planoId: event.target.value }))
                }
              >
                <option value="">Selecione um plano</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nome} - {formatCurrency(plan.valor)}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10"
                value={subscriberForm.statusPagamento}
                onChange={(event) =>
                  setSubscriberForm((current) => ({
                    ...current,
                    statusPagamento: event.target.value
                  }))
                }
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
                <option value="cancelado">Cancelado</option>
              </select>
              <textarea
                className="px-4 py-3 rounded-2xl bg-white/70 border border-ink/10 min-h-24"
                placeholder="Observacoes"
                value={subscriberForm.observacoes}
                onChange={(event) =>
                  setSubscriberForm((current) => ({
                    ...current,
                    observacoes: event.target.value
                  }))
                }
              />
              <button
                className="bg-ink text-cream rounded-2xl py-3 text-sm disabled:opacity-60"
                disabled={savingSubscriber}
              >
                {savingSubscriber ? "Salvando..." : "Cadastrar assinante"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

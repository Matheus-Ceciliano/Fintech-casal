"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, TrendingDown, TrendingUp, X } from "lucide-react";

const CATEGORY_ICONS: Record<string, string> = {
  Alimentação: "🍔", Mercado: "🛒", Moradia: "🏠", Transporte: "⛽",
  Saúde: "💊", Lazer: "🍿", Viagem: "✈️", Salário: "💰",
  Investimento: "📈", Reserva: "🐷", Dívida: "📉", Empréstimo: "🏦", Outros: "📦",
};

type Tx = {
  id: string;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  userId: string;
  isShared: boolean;
};

type Props = {
  transactions: Tx[];
  myId: string;
  myName: string;
  partnerName: string;
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(
    new Date(d + "T00:00:00")
  );
}

function isSavingsTx(tx: Tx) {
  const description = tx.description.toLowerCase();
  return tx.category === "Reserva" || description.startsWith("depósito:") || description.startsWith("deposito:") || description.startsWith("resgate:");
}

export function TransactionsClient({ transactions, myId, myName, partnerName }: Props) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [person, setPerson] = useState("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const hasActiveFilters =
    search !== "" ||
    type !== "all" ||
    person !== "all";

  const clearFilters = () => {
    setSearch("");
    setType("all");
    setPerson("all");
  };

  const txs = useMemo(() => {
    return transactions.filter((tx) => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (type === "income" && tx.type !== "income") return false;
      if (type === "expense" && tx.type !== "expense") return false;
      if (type === "savings" && !isSavingsTx(tx)) return false;
      if (person === "me" && (tx.userId !== myId || tx.isShared)) return false;
      if (person === "partner" && (tx.userId === myId || tx.isShared)) return false;
      if (person === "both" && !tx.isShared) return false;
      return true;
    });
  }, [transactions, search, type, person, myId]);

  const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = txs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const renderFilters = () => (
    <>
      <label className="tx-filter-search">
        <Search size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar transações..." />
      </label>

      <div className="tx-filter-pills">
        {[
          { val: "all", label: "Todos os tipos" },
          { val: "income", label: "Receita" },
          { val: "expense", label: "Despesa" },
          { val: "savings", label: "Cofrinho" },
        ].map((item) => (
          <button key={item.val} type="button" className={`tab-pill${type === item.val ? " active" : ""}`} onClick={() => setType(item.val)}>
            {item.label}
          </button>
        ))}
      </div>

      <select className="tx-filter-control" value={person} onChange={(e) => setPerson(e.target.value)}>
        <option value="all">Todas as pessoas</option>
        <option value="me">Eu</option>
        <option value="partner">Parceiro</option>
        <option value="both">Ambos</option>
      </select>

      {hasActiveFilters && (
        <button type="button" className="tx-clear-filters" onClick={clearFilters}>
          Limpar filtros
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="metrics-row">
        <div className="metric-card income">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Receitas
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--income-color)", margin: 0 }}>
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <TrendingUp size={20} color="var(--income-color)" />
          </div>
        </div>
        <div className="metric-card expense">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Despesas
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: "var(--expense-color)", margin: 0 }}>
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <TrendingDown size={20} color="var(--expense-color)" />
          </div>
        </div>
        <div className="metric-card balance">
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Saldo
            </p>
            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: totalIncome - totalExpenses >= 0 ? "var(--savings-color)" : "var(--expense-color)",
                margin: 0,
              }}
            >
              {formatCurrency(totalIncome - totalExpenses)}
            </p>
          </div>
        </div>
      </div>

      <div className="tx-filters-desktop">{renderFilters()}</div>
      <div className="tx-filters-mobile">
        <button type="button" className="btn-ghost" onClick={() => setSheetOpen(true)}>
          <SlidersHorizontal size={16} />
          Filtros
        </button>
        {hasActiveFilters && (
          <button type="button" className="tx-clear-filters" onClick={clearFilters}>
            Limpar filtros
          </button>
        )}
      </div>

      {sheetOpen && (
        <div className="tx-filter-backdrop" onClick={() => setSheetOpen(false)}>
          <div className="tx-filter-sheet sheet-enter" onClick={(e) => e.stopPropagation()}>
            <div className="tx-filter-sheet-header">
              <strong>Filtros</strong>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Fechar filtros">
                <X size={18} />
              </button>
            </div>
            <div className="tx-filter-sheet-body">{renderFilters()}</div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: "8px 24px" }}>
        {txs.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🔍</span>
            <p style={{ fontWeight: 600 }}>Nenhuma transação encontrada.</p>
            <p style={{ fontSize: 13 }}>Tente ajustar os filtros.</p>
          </div>
        ) : (
          txs.map((tx, idx) => (
            <div
              key={tx.id}
              className="tx-item-container"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "14px 0",
                borderBottom: "1px solid var(--border-subtle)",
                background: idx % 2 === 0 ? "transparent" : "var(--border-subtle)",
              }}
            >
              {/* Linha superior = ícone + descrição + valor */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                  <div
                    className="cat-icon"
                    style={{
                      background: tx.type === "income" ? "var(--income-bg)" : "var(--expense-bg)",
                      borderRadius: 12,
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 20,
                      flexShrink: 0,
                    }}
                  >
                    {CATEGORY_ICONS[tx.category] || "💸"}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tx.description}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "clamp(14px, 4vw, 18px)",
                    color: tx.type === "income" ? "var(--income-color)" : "var(--expense-color)",
                    flexShrink: 0,
                    wordBreak: "break-word",
                  }}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatCurrency(Number(tx.amount))}
                </div>
              </div>

              {/* Linha inferior = categoria badge + responsável + data */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 56, flexWrap: "wrap", fontSize: 12, color: "var(--text-muted)" }}>
                <span className={`chip chip-${tx.type === "income" ? "green" : "red"}`}>
                  {tx.category}
                </span>
                <span>{tx.userId === myId ? myName : partnerName}</span>
                <span>•</span>
                <span>{formatDate(tx.date)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

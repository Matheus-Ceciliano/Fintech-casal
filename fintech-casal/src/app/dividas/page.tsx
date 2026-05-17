import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react";
import { AddDebtModal } from "@/components/AddDebtModal";

export const dynamic = "force-dynamic";

export default async function DividasPage() {
  const cookieStore = await cookies();
  // @ts-expect-error
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();
  if (!profile?.couple_id) redirect("/setup");

  let debts = null;
  try {
    const { data } = await supabase
      .from("debts")
      .select("*")
      .eq("couple_id", profile.couple_id)
      .order("due_date", { ascending: true });
    debts = data;
  } catch {
    debts = null;
  }

  const openDebts = (debts || []).filter((d: { status: string }) => d.status !== "paid");
  const paidDebts = (debts || []).filter((d: { status: string }) => d.status === "paid");
  const totalDebt = openDebts.reduce((s: number, d: { amount: unknown }) => s + Number(d.amount), 0);

  function formatCurrency(v: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
  }

  return (
    <div className="page-animate" style={{ background: "var(--bg-primary)", minHeight: "100dvh" }}>

      {/* ── Top bar ── */}
      <div
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            💳 Dívidas
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 500 }}>
            Controle parcelas e compromissos financeiros
          </p>
        </div>
        <AddDebtModal />
      </div>

      <div style={{ padding: "24px 32px 48px" }}>

        {/* DB not configured warning */}
        {!debts && (
          <div
            style={{
              background: "rgba(224, 69, 123, 0.06)",
              border: "1px solid rgba(224, 69, 123, 0.2)",
              borderRadius: "var(--radius-card)",
              padding: "16px 20px",
              marginBottom: 24,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <AlertCircle size={18} style={{ color: "var(--expense-color)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--expense-color)", margin: "0 0 4px" }}>
                Tabela ainda não configurada
              </p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Execute a migration SQL no Supabase para habilitar o módulo de Dívidas.
              </p>
            </div>
          </div>
        )}

        {/* ── Summary cards ── */}
        <div className="metrics-row" style={{ marginBottom: 28 }}>
          <div className="metric-card expense">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Total em Aberto
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--expense-color)", margin: 0 }}>
                  {formatCurrency(totalDebt)}
                </p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--expense-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={20} color="var(--expense-color)" />
              </div>
            </div>
          </div>

          <div className="metric-card balance">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Em Aberto
                </p>
                <p style={{ fontSize: 36, fontWeight: 800, color: "var(--expense-color)", margin: 0, lineHeight: 1 }}>
                  {openDebts.length}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>dívidas ativas</p>
              </div>
              <AlertCircle size={20} color="var(--expense-color)" style={{ opacity: 0.5 }} />
            </div>
          </div>

          <div className="metric-card income">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Quitadas
                </p>
                <p style={{ fontSize: 36, fontWeight: 800, color: "var(--income-color)", margin: 0, lineHeight: 1 }}>
                  {paidDebts.length}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0" }}>pagas</p>
              </div>
              <CheckCircle2 size={20} color="var(--income-color)" style={{ opacity: 0.5 }} />
            </div>
          </div>
        </div>

        {/* ── Open debts ── */}
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "var(--text-primary)" }}>
            Em Aberto
          </h2>

          {openDebts.length === 0 ? (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <span className="empty-state-icon">🎉</span>
              <p style={{ fontWeight: 600 }}>Sem dívidas abertas!</p>
              <p style={{ fontSize: 13 }}>Adicione uma dívida para começar a controlar.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {openDebts.map((d: Record<string, unknown>) => (
                <div
                  key={d.id as string}
                  className="tx-row"
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "var(--expense-bg)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CreditCard size={20} color="var(--expense-color)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {String(d.title || d.description || "Dívida")}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      Vence:{" "}
                      {d.due_date
                        ? new Intl.DateTimeFormat("pt-BR").format(new Date(d.due_date as string))
                        : "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "var(--expense-color)" }}>
                      {formatCurrency(Number(d.amount))}
                    </div>
                    <span className="chip chip-red" style={{ marginTop: 4, display: "inline-block" }}>
                      em aberto
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Paid debts ── */}
        {paidDebts.length > 0 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "var(--text-primary)" }}>
              Quitadas
            </h2>
            {paidDebts.map((d: Record<string, unknown>) => (
              <div key={d.id as string} className="tx-row" style={{ opacity: 0.6 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "var(--income-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={20} color="var(--income-color)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      textDecoration: "line-through",
                    }}
                  >
                    {String(d.title || d.description || "Dívida")}
                  </div>
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "var(--income-color)", flexShrink: 0 }}
                >
                  ✓ {formatCurrency(Number(d.amount))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

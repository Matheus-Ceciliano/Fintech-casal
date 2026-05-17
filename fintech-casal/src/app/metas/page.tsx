import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GoalCard } from "@/components/GoalCard";
import { NewGoalModal } from "@/components/NewGoalModal";
import { PiggyBank, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function MetasPage() {
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

  const [{ data: goals }] = await Promise.all([
    supabase
      .from("goals")
      .select("*")
      .eq("couple_id", profile.couple_id)
      .order("created_at", { ascending: false }),
  ]);

  const metas = goals || [];
  let totalSaved = 0, totalTarget = 0;
  metas.forEach((g) => {
    totalSaved += Number(g.current_amount);
    totalTarget += Number(g.target_amount);
  });
  const overallProgress = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;
  const completedCount = metas.filter(
    (g) => Number(g.current_amount) >= Number(g.target_amount)
  ).length;

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
            🐷 Cofrinho
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "2px 0 0", fontWeight: 500 }}>
            Objetivos financeiros a dois
          </p>
        </div>
        <NewGoalModal />
      </div>

      <div style={{ padding: "24px 32px 48px" }}>

        {/* ── Summary row ── */}
        <div className="metrics-row" style={{ marginBottom: 28 }}>
          {/* Total guardado */}
          <div className="metric-card savings">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Total Guardado
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--savings-color)", margin: 0 }}>
                  {formatCurrency(totalSaved)}
                </p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--savings-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PiggyBank size={20} color="var(--savings-color)" />
              </div>
            </div>
          </div>

          {/* Meta total */}
          <div className="metric-card balance">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Meta Total
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#4158D0", margin: 0 }}>
                  {formatCurrency(totalTarget)}
                </p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(65,88,208,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Target size={20} color="#4158D0" />
              </div>
            </div>
          </div>

          {/* Progresso geral */}
          <div className="metric-card income">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Progresso
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: "var(--income-color)", margin: 0 }}>
                  {overallProgress.toFixed(1)}%
                </p>
                <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
                  {completedCount} de {metas.length} concluídos
                </p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--income-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TrendingUp size={20} color="var(--income-color)" />
              </div>
            </div>
            {totalTarget > 0 && (
              <div className="progress-track" style={{ marginTop: 4 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${overallProgress}%`,
                    background: "linear-gradient(90deg, #1B7A4B, #34d399)",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Goals grid ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            Cofrinhos Ativos
          </h2>
          {metas.length > 0 && (
            <span
              style={{
                background: "var(--savings-bg)",
                color: "var(--savings-color)",
                borderRadius: 100,
                padding: "3px 12px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {metas.length}
            </span>
          )}
        </div>

        {metas.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <span className="empty-state-icon">🐷</span>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Nenhum cofrinho ainda</p>
              <p style={{ fontSize: 13 }}>
                Crie o primeiro cofrinho do casal! Que tal uma viagem dos sonhos?
              </p>
            </div>
          </div>
        ) : (
          <div className="goals-grid">
            {metas.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

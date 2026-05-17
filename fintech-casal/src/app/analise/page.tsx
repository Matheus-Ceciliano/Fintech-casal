import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Percent } from "lucide-react";
import { AnaliseCharts } from "@/components/AnaliseCharts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_ICONS: Record<string, string> = {
  Alimentação: "🍔", Mercado: "🛒", Moradia: "🏠", Transporte: "⛽",
  Saúde: "💊", Lazer: "🍿", Viagem: "✈️", Salário: "💰",
  Investimento: "📈", Reserva: "🐷", Dívida: "📉", Empréstimo: "🏦", Outros: "📦",
};

function fmtCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
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

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.y || String(now.getFullYear()));
  const month = parseInt(params.m || String(now.getMonth()));

  const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const [{ data: transactions }, { data: profiles }] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("couple_id", profile.couple_id)
      .gte("date", firstDay)
      .lte("date", lastDay)
      .order("date", { ascending: true }),
    supabase.from("profiles").select("id, full_name").eq("couple_id", profile.couple_id),
  ]);

  const partnerProfile = profiles?.find((p) => p.id !== session.user.id);
  const myName = profiles?.find((p) => p.id === session.user.id)?.full_name?.split(" ")[0] || "Você";
  const partnerName = partnerProfile?.full_name?.split(" ")[0] || "Parceiro(a)";

  const txs = transactions || [];
  let totalIncome = 0, totalExpenses = 0, myExpenses = 0, partnerExpenses = 0;
  const categoryMap: Record<string, number> = {};

  txs.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "income") totalIncome += amt;
    else {
      totalExpenses += amt;
      if (t.user_id === session.user.id) myExpenses += amt;
      else partnerExpenses += amt;
      categoryMap[t.category] = (categoryMap[t.category] || 0) + amt;
    }
  });

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  const netBalance = totalIncome - totalExpenses;

  const prevMonth = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const nextMonth = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );

  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value, icon: CATEGORY_ICONS[name] || "💸" }));

  const personData = [
    { name: myName, value: myExpenses, color: "#C850C0" },
    { name: partnerName, value: partnerExpenses, color: "#4158D0" },
  ].filter((d) => d.value > 0);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const timelineData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTxs = txs.filter((t) => t.date === dayStr);
    return {
      day: String(day),
      receitas: dayTxs
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0),
      despesas: dayTxs
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0),
    };
  });

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
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
          📊 Análise
        </h1>

        {/* Month selector */}
        <div className="month-selector">
          <Link href={`/analise?y=${prevMonth.y}&m=${prevMonth.m}`} className="month-btn">
            <ChevronLeft size={14} />
          </Link>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              minWidth: 110,
              textAlign: "center",
              textTransform: "capitalize",
            }}
          >
            {monthLabel}
          </span>
          {!isCurrentMonth ? (
            <Link href={`/analise?y=${nextMonth.y}&m=${nextMonth.m}`} className="month-btn">
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span
              className="month-btn"
              style={{ opacity: 0.3, cursor: "not-allowed", pointerEvents: "none" }}
            >
              <ChevronRight size={14} />
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 32px 48px" }}>

        {/* ── 4 KPI Cards DESKTOP ── */}
        <div className="analise-kpis-grid-desktop">
          {[
            {
              label: "Receitas",
              val: fmtCurrency(totalIncome),
              color: "var(--income-color)",
              bg: "var(--income-bg)",
              border: "var(--income-color)",
              icon: <TrendingUp size={18} color="var(--income-color)" />,
            },
            {
              label: "Despesas",
              val: fmtCurrency(totalExpenses),
              color: "var(--expense-color)",
              bg: "var(--expense-bg)",
              border: "var(--expense-color)",
              icon: <TrendingDown size={18} color="var(--expense-color)" />,
            },
            {
              label: "Saldo",
              val: fmtCurrency(netBalance),
              color: netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)",
              bg: netBalance >= 0 ? "var(--savings-bg)" : "var(--expense-bg)",
              border: netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)",
              icon: <PiggyBank size={18} color={netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)"} />,
            },
            {
              label: "Tx. Poupança",
              val: `${savingsRate.toFixed(1)}%`,
              color:
                savingsRate >= 20
                  ? "var(--income-color)"
                  : savingsRate >= 0
                    ? "#D97706"
                    : "var(--expense-color)",
              bg:
                savingsRate >= 20
                  ? "var(--income-bg)"
                  : savingsRate >= 0
                    ? "rgba(217,119,6,0.08)"
                    : "var(--expense-bg)",
              border:
                savingsRate >= 20
                  ? "var(--income-color)"
                  : savingsRate >= 0
                    ? "#D97706"
                    : "var(--expense-color)",
              icon: <Percent size={18} color={savingsRate >= 20 ? "var(--income-color)" : savingsRate >= 0 ? "#D97706" : "var(--expense-color)"} />,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="analise-kpi-card"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderLeft: `4px solid ${k.border}`,
                borderRadius: "var(--radius-card)",
                padding: "18px 20px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                    {k.label}
                  </p>
                  <p style={{ fontSize: "clamp(15px, 4vw, 20px)", fontWeight: 700, color: k.color, margin: 0, wordBreak: "break-all" }}>
                    {k.val}
                  </p>
                </div>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: k.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {k.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── 4 KPI Cards MOBILE (hidden on desktop via CSS) ── */}
        <div className="analise-kpis-grid-mobile" style={{ display: "none", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            {
              label: "Receitas",
              val: fmtCurrency(totalIncome),
              color: "var(--income-color)",
              bg: "var(--income-bg)",
              border: "var(--income-color)",
              icon: <TrendingUp size={14} color="var(--income-color)" />,
            },
            {
              label: "Despesas",
              val: fmtCurrency(totalExpenses),
              color: "var(--expense-color)",
              bg: "var(--expense-bg)",
              border: "var(--expense-color)",
              icon: <TrendingDown size={14} color="var(--expense-color)" />,
            },
            {
              label: "Saldo",
              val: fmtCurrency(netBalance),
              color: netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)",
              bg: netBalance >= 0 ? "var(--savings-bg)" : "var(--expense-bg)",
              border: netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)",
              icon: <PiggyBank size={14} color={netBalance >= 0 ? "var(--savings-color)" : "var(--expense-color)"} />,
            },
            {
              label: "Poupança%",
              val: `${savingsRate.toFixed(1)}%`,
              color:
                savingsRate >= 20
                  ? "var(--income-color)"
                  : savingsRate >= 0
                    ? "#D97706"
                    : "var(--expense-color)",
              bg:
                savingsRate >= 20
                  ? "var(--income-bg)"
                  : savingsRate >= 0
                    ? "rgba(217,119,6,0.08)"
                    : "var(--expense-bg)",
              border:
                savingsRate >= 20
                  ? "var(--income-color)"
                  : savingsRate >= 0
                    ? "#D97706"
                    : "var(--expense-color)",
              icon: <Percent size={14} color={savingsRate >= 20 ? "var(--income-color)" : savingsRate >= 0 ? "#D97706" : "var(--expense-color)"} />,
            },
          ].map((k) => (
            <div
              key={k.label}
              className="analise-kpi-card-mob"
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderLeft: `4px solid ${k.border}`,
                borderRadius: "var(--radius-card)",
                padding: "12px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                  {k.label}
                </span>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: k.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {k.icon}
                </div>
              </div>
              <div style={{ fontSize: "clamp(15px, 4.2vw, 19px)", fontWeight: 700, color: k.color, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {k.val}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts ── */}
        <AnaliseCharts
          categoryData={categoryData}
          personData={personData}
          timelineData={timelineData}
          myName={myName}
          partnerName={partnerName}
          totalExpenses={totalExpenses}
        />
      </div>
    </div>
  );
}

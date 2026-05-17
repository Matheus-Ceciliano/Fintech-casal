import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardClient } from "@/components/DashboardClient";
import { AddTransactionModal } from "@/components/AddTransactionModal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CATEGORY_ICONS: Record<string, string> = {
  Alimentação: "🍔", Mercado: "🛒", Moradia: "🏠", Transporte: "⛽",
  Saúde: "💊", Lazer: "🍿", Viagem: "✈️", Salário: "💰",
  Investimento: "📈", Reserva: "🐷", Dívida: "📉",
  Empréstimo: "🏦", Outros: "📦",
};

function getMonthLabel(year: number, month: number) {
  const d = new Date(year, month, 1);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(d);
}

function inferGoalEmoji(title: string) {
  const normalized = title.toLowerCase();
  if (/(casamento|noivado)/.test(normalized)) return "💍";
  if (/(viagem|férias|ferias)/.test(normalized)) return "✈️";
  if (/(carro|moto)/.test(normalized)) return "🚗";
  if (/(casa|apartamento)/.test(normalized)) return "🏠";
  if (/(educação|educacao|curso)/.test(normalized)) return "📚";
  if (/(emergência|emergencia|reserva)/.test(normalized)) return "🛡️";
  if (/saúde|saude/.test(normalized)) return "💊";
  if (/(tecnologia|celular)/.test(normalized)) return "💻";
  if (/(bebê|bebe|filho)/.test(normalized)) return "👶";
  if (/(pet|animal)/.test(normalized)) return "🐾";
  if (/festa/.test(normalized)) return "🎉";
  if (/presente/.test(normalized)) return "🎁";
  if (/reforma/.test(normalized)) return "🔨";
  if (/(negócio|negocio|investimento)/.test(normalized)) return "💼";
  return "🐷";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id, full_name, avatar_url")
    .eq("id", session.user.id)
    .single();
  if (!profile?.couple_id) redirect("/setup");

  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.y || String(now.getFullYear()));
  const month = parseInt(params.m || String(now.getMonth()));

  const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
  const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

  // Previous month range
  const prevMonthDate = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const prevFirstDay = new Date(prevMonthDate.y, prevMonthDate.m, 1).toISOString().split("T")[0];
  const prevLastDay = new Date(prevMonthDate.y, prevMonthDate.m + 1, 0).toISOString().split("T")[0];

  // Fetch everything in parallel
  const [
    { data: coupleData },
    { data: profiles },
    { data: transactions },
    { data: prevTransactions },
    { data: goals },
  ] = await Promise.all([
    supabase.from("couples").select("invite_code").eq("id", profile.couple_id).single(),
    supabase.from("profiles").select("id, full_name, avatar_url").eq("couple_id", profile.couple_id),
    supabase.from("transactions").select("*").eq("couple_id", profile.couple_id)
      .gte("date", firstDay).lte("date", lastDay)
      .order("date", { ascending: false }).order("created_at", { ascending: false }),
    supabase.from("transactions").select("amount, type").eq("couple_id", profile.couple_id)
      .gte("date", prevFirstDay).lte("date", prevLastDay),
    supabase.from("goals").select("*").eq("couple_id", profile.couple_id),
  ]);

  // Debts (table may not exist)
  let debts: Record<string, unknown>[] | null = null;
  try {
    const { data } = await supabase.from("debts").select("*").eq("couple_id", profile.couple_id).order("due_date", { ascending: true });
    debts = data;
  } catch { debts = null; }

  const txs = transactions || [];
  const partnerProfile = profiles?.find((p) => p.id !== session.user.id);
  const myName = profile.full_name?.split(" ")[0] || "Você";
  const partnerName = partnerProfile?.full_name?.split(" ")[0] || "Parceiro(a)";
  const myId = session.user.id;
  const profileById = new Map((profiles || []).map((p) => [p.id, p]));
  const getDebtOwner = (d: Record<string, unknown>, fallbackId = myId) => {
    const ownerId = (d.user_id || d.profile_id || d.responsible_id || d.paid_by || d.paid_by_user_id || fallbackId) as string;
    const owner = profileById.get(ownerId);
    return {
      userName: owner?.full_name?.split(" ")[0] || (ownerId === myId ? myName : partnerName),
      avatarUrl: owner?.avatar_url || null,
    };
  };

  // Aggregate current month
  let totalIncome = 0, totalExpenses = 0, myIncome = 0, partnerIncome = 0, myExpenses = 0, partnerExpenses = 0;
  const categoryTotals: Record<string, number> = {};

  txs.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === "income") {
      totalIncome += amt;
      if (t.user_id === myId) myIncome += amt; else partnerIncome += amt;
    } else {
      totalExpenses += amt;
      if (t.user_id === myId) myExpenses += amt; else partnerExpenses += amt;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
    }
  });

  const netBalance = totalIncome - totalExpenses;
  const totalSaved = (goals || []).reduce((s, g) => s + Number(g.current_amount), 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Previous month totals (for comparison)
  const prevMonthIncome = (prevTransactions || [])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const prevMonthExpenses = (prevTransactions || [])
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  // Top 5 categories
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, val]) => ({ cat, val, icon: CATEGORY_ICONS[cat] || "💸" }));

  // Recent incomes (max 5)
  const recentIncomes = txs.filter((t) => t.type === "income").slice(0, 5).map((t) => ({
    id: t.id, description: t.description, amount: Number(t.amount),
    date: t.date, userId: t.user_id, category: t.category,
  }));

  // Recent expenses (max 5)
  const recentExpenses = txs.filter((t) => t.type === "expense").slice(0, 5).map((t) => ({
    id: t.id, description: t.description, amount: Number(t.amount),
    date: t.date, userId: t.user_id, category: t.category,
  }));

  // Timeline (day-by-day)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const timelineData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTxs = txs.filter((t) => t.date === dayStr);
    return {
      day: String(day),
      receitas: dayTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
      despesas: dayTxs.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    };
  });

  // Debts processing
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const in7Days = new Date(today); in7Days.setDate(in7Days.getDate() + 7);
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0); lastDayOfMonth.setHours(23, 59, 59, 999);

  const upcomingDebts = (debts || [])
    .filter((d) => {
      if (!d.due_date || d.status === "paid") return false;
      const due = new Date(`${d.due_date as string}T00:00:00`);
      return due >= today && due <= in7Days;
    })
    .slice(0, 5)
    .map((d) => {
      const owner = getDebtOwner(d);
      return {
        id: d.id as string,
        title: d.title as string,
        amount: Number(d.amount),
        dueDate: d.due_date as string,
        userName: owner.userName,
        avatarUrl: owner.avatarUrl,
      };
    });

  const paidThisMonth = (debts || [])
    .filter((d) => {
      if (d.status !== "paid" || !d.paid_at) return false;
      const paidDate = new Date(d.paid_at as string);
      return paidDate >= firstDayOfMonth && paidDate <= lastDayOfMonth;
    })
    .sort((a, b) => new Date(b.paid_at as string).getTime() - new Date(a.paid_at as string).getTime())
    .slice(0, 5)
    .map((d) => {
      const owner = getDebtOwner(d);
      return {
        id: d.id as string,
        title: d.title as string,
        amount: Number(d.amount),
        paidAt: d.paid_at as string,
        userName: owner.userName,
        avatarUrl: owner.avatarUrl,
      };
    });

  // Goals
  const goalsData = (goals || []).map((g) => ({
    id: g.id, title: g.title,
    current: Number(g.current_amount), target: Number(g.target_amount),
    emoji: String((g as Record<string, unknown>).emoji || "").trim() || inferGoalEmoji(g.title),
  }));

  // Nav
  const prevMonthNav = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const nextMonthNav = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Contribution pct
  const totalContrib = myExpenses + partnerExpenses;
  const myExpPct = totalContrib > 0 ? Math.round((myExpenses / totalContrib) * 100) : 50;
  const partnerExpPct = 100 - myExpPct;

  const totalIncomePeople = myIncome + partnerIncome;
  const myIncPct = totalIncomePeople > 0 ? Math.round((myIncome / totalIncomePeople) * 100) : 50;
  const partnerIncPct = 100 - myIncPct;

  // Invite code
  const showInvite = !!(profiles && profiles.length === 1 && coupleData?.invite_code);

  return (
    <div className="page-animate" style={{ background: "var(--bg-primary)", minHeight: "100dvh" }}>
      {/* ── Sticky top bar ── */}
      <div className="dashboard-top-bar" style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-color)",
        padding: "14px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 20,
        gap: 12,
      }}>
        <h1 className="dashboard-header-title" style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>
          Dashboard
        </h1>
        <div className="month-selector">
          <Link href={`/?y=${prevMonthNav.y}&m=${prevMonthNav.m}`} className="month-btn">
            <ChevronLeft size={14} />
          </Link>
          <span className="month-selector-label" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", minWidth: 90, textAlign: "center", textTransform: "capitalize" }}>
            {getMonthLabel(year, month).replace(" de ", " ")}
          </span>
          {!isCurrentMonth ? (
            <Link href={`/?y=${nextMonthNav.y}&m=${nextMonthNav.m}`} className="month-btn">
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span className="month-btn" style={{ opacity: 0.3, cursor: "not-allowed", pointerEvents: "none" }}>
              <ChevronRight size={14} />
            </span>
          )}
        </div>
      </div>

      {/* ── All sections — managed by DashboardClient for hidden state ── */}
      <DashboardClient
        myName={myName}
        partnerName={partnerName}
        myId={myId}
        netBalance={netBalance}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        totalSaved={totalSaved}
        savingsRate={savingsRate}
        myExpenses={myExpenses}
        partnerExpenses={partnerExpenses}
        myExpPct={myExpPct}
        partnerExpPct={partnerExpPct}
        myIncome={myIncome}
        partnerIncome={partnerIncome}
        myIncPct={myIncPct}
        partnerIncPct={partnerIncPct}
        prevMonthIncome={prevMonthIncome}
        prevMonthExpenses={prevMonthExpenses}
        recentIncomes={recentIncomes}
        recentExpenses={recentExpenses}
        topCategories={topCategories}
        timelineData={timelineData}
        goals={goalsData}
        upcomingDebts={upcomingDebts}
        paidThisMonth={paidThisMonth}
        hasDebtsTable={debts !== null}
        inviteCode={showInvite ? coupleData!.invite_code : null}
        avatarUrl={profile.avatar_url || null}
      />

      <AddTransactionModal />
    </div>
  );
}

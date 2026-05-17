import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { TransactionsClient } from "@/components/TransactionsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TransactionsPage({
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
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("couple_id", profile.couple_id),
  ]);

  const partnerProfile = profiles?.find((p) => p.id !== session.user.id);
  const myName = profiles?.find((p) => p.id === session.user.id)?.full_name?.split(" ")[0] || "Você";
  const partnerName = partnerProfile?.full_name?.split(" ")[0] || "Parceiro(a)";

  const prevMonth = month === 0 ? { y: year - 1, m: 11 } : { y: year, m: month - 1 };
  const nextMonth = month === 11 ? { y: year + 1, m: 0 } : { y: year, m: month + 1 };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(year, month, 1)
  );
  function buildURL(extra: Record<string, string>) {
    const p = new URLSearchParams({
      y: String(year),
      m: String(month),
      ...extra,
    });
    return `/transactions?${p}`;
  }

  const normalizedTransactions = (transactions || []).map((tx) => ({
    id: tx.id as string,
    amount: Number(tx.amount),
    type: tx.type as string,
    category: tx.category as string,
    description: tx.description as string,
    date: tx.date as string,
    userId: tx.user_id as string,
    isShared: Boolean(tx.is_shared),
  }));

  return (
    <div className="page-animate" style={{ background: "var(--bg-primary)", minHeight: "100dvh" }}>
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
          Transações
        </h1>

        <div className="month-selector">
          <Link
            href={buildURL({ y: String(prevMonth.y), m: String(prevMonth.m) })}
            className="month-btn"
          >
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
            <Link
              href={buildURL({ y: String(nextMonth.y), m: String(nextMonth.m) })}
              className="month-btn"
            >
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
        <TransactionsClient
          transactions={normalizedTransactions}
          myId={session.user.id}
          myName={myName}
          partnerName={partnerName}
        />
      </div>

      <AddTransactionModal />
    </div>
  );
}

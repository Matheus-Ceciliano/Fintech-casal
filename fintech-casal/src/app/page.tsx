import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LogOut, ArrowDownToLine, ArrowUpToLine, Calendar, Receipt, TrendingDown, Wallet } from "lucide-react";
import { BiometricOptIn } from "@/components/BiometricOptIn";
import { AreaChartCard, ExpensePieChartCard, IncomePieChartCard } from "@/components/Charts";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { InvitePartnerCard } from "@/components/InvitePartnerCard";
import { seedDummyData } from "@/app/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Função auxiliar para mapear categorias para emojis
function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    'Alimentação': '🍔',
    'Mercado': '🛒',
    'Moradia': '🏠',
    'Transporte': '⛽',
    'Saúde': '💊',
    'Lazer': '🍿',
    'Viagem': '✈️',
    'Salário': '💰',
    'Investimento': '📈',
    'Reserva': '🐷',
    'Dívida': '📉',
    'Empréstimo': '🏦',
    'Outros': '📦'
  };
  return icons[category] || '💸';
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  
  return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' }).format(date);
}

export default async function Home() {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("couple_id, full_name, has_biometrics")
    .eq("id", session.user.id)
    .single();

  if (error || !profile?.couple_id) redirect("/setup");

  // Buscar detalhes do grupo e membros
  const { data: couple } = await supabase.from("couples").select("invite_code").eq("id", profile.couple_id).single();
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").eq("couple_id", profile.couple_id);
  
  const partnerProfile = profiles?.find(p => p.id !== session.user.id);
  const partnerName = partnerProfile ? partnerProfile.full_name?.split(" ")[0] : "Parceiro(a)";

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("couple_id", profile.couple_id)
    .gte("date", firstDay)
    .lte("date", lastDay)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: goals } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("couple_id", profile.couple_id);

  const txs = transactions || [];

  // Cálculos de Resumo e Patrimônio
  let totalExpenses = 0, myExpenses = 0, partnerExpenses = 0;
  let totalIncome = 0, myIncome = 0, partnerIncome = 0;
  let totalSaved = 0;
  let totalDebt = 0;

  if (goals) {
    goals.forEach(g => {
      totalSaved += Number(g.current_amount);
    });
  }

  txs.forEach((t) => {
    const amount = Number(t.amount);
    if (t.type === "expense") {
      totalExpenses += amount;
      if (t.user_id === session.user.id) myExpenses += amount;
      else partnerExpenses += amount;

      if (t.category === 'Dívida' || t.category === 'Empréstimo') {
        totalDebt += amount;
      }
    } else if (t.type === "income") {
      totalIncome += amount;
      if (t.user_id === session.user.id) myIncome += amount;
      else partnerIncome += amount;
    }
  });

  const netBalance = totalIncome - totalExpenses;

  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dailyAverage = currentDay > 0 ? totalExpenses / currentDay : 0;
  const predictedTotal = dailyAverage * daysInMonth;

  // Barra de Progresso
  const metaGastos = 4000;
  const progressPercent = Math.min((totalExpenses / metaGastos) * 100, 100);

  // Filtros de transações
  const recentIncomes = txs.filter(t => t.type === 'income').slice(0, 4);
  const recentExpenses = txs.filter(t => t.type === 'expense').slice(0, 4);

  // Mês Atual
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8 pb-24 space-y-12">
      {!profile.has_biometrics && <BiometricOptIn userId={session.user.id} />}

      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 mt-1">
            <Calendar size={16} />
            <p className="capitalize font-medium">Exibindo dados de {currentMonthName}</p>
          </div>
        </div>
        <form action="/auth/signout" method="POST">
          <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors bg-zinc-100 dark:bg-zinc-900 rounded-full">
            <LogOut size={18} />
          </button>
        </form>
      </header>

      {/* Convite de Parceiro */}
      {profiles && profiles.length === 1 && couple?.invite_code && (
        <InvitePartnerCard inviteCode={couple.invite_code} />
      )}

      {txs.length === 0 && (
        <form action={seedDummyData}>
          <button className="w-full bg-zinc-800 text-indigo-400 border border-indigo-500/30 py-3 rounded-xl text-sm font-medium hover:bg-zinc-700 transition-colors">
            + Gerar Dados de Teste
          </button>
        </form>
      )}

      {/* SEÇÃO 1: ENTRADAS E PATRIMÔNIO */}
      <section className="relative">
        <div className="absolute -left-4 md:-left-8 lg:-left-12 top-0 bottom-0 w-1.5 lg:w-2 bg-emerald-500 rounded-r-lg shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <ArrowDownToLine size={20} />
          </div>
          <h2 className="text-xl font-bold text-emerald-400">Patrimônio e Entradas</h2>
        </div>

        {/* Patrimônio Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Wallet size={64} />
            </div>
            <h3 className="text-zinc-400 text-xs font-bold tracking-wider mb-2 uppercase">Saldo Líquido</h3>
            <div className={`text-3xl font-bold tracking-tight ${netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {netBalance.toFixed(2)}
            </div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <h3 className="text-zinc-400 text-xs font-bold tracking-wider mb-2 uppercase">Cofrinho</h3>
            <div className="text-3xl font-bold tracking-tight text-sky-400">R$ {totalSaved.toFixed(2)}</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <h3 className="text-zinc-400 text-xs font-bold tracking-wider mb-2 uppercase">Dívidas</h3>
            <div className="text-3xl font-bold tracking-tight text-rose-400">R$ {totalDebt.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5">
            <IncomePieChartCard myIncome={myIncome} partnerIncome={partnerIncome} partnerName={partnerName} />
          </div>
          <div className="lg:col-span-7">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 h-full flex flex-col">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Últimas Entradas</h3>
              <div className="space-y-3 flex-grow">
                {recentIncomes.length > 0 ? recentIncomes.map(tx => (
                  <div key={tx.id} className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400">
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <p className="font-medium text-emerald-100 text-sm">{tx.description}</p>
                        <p className="text-xs text-emerald-500/70 mt-0.5">
                          {tx.user_id === session.user.id ? 'Você' : partnerName} • {formatRelativeDate(tx.date)}
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-400">
                      + R$ {Number(tx.amount).toFixed(2)}
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-600">
                    Nenhuma entrada de dinheiro recente.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: GASTOS */}
      <section className="relative">
        <div className="absolute -left-4 md:-left-8 lg:-left-12 top-0 bottom-0 w-1.5 lg:w-2 bg-indigo-500 rounded-r-lg shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
        <div className="flex items-center space-x-2 mb-6">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
            <ArrowUpToLine size={20} />
          </div>
          <h2 className="text-xl font-bold text-indigo-400">Despesas do Casal</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card Total */}
          <div className="lg:col-span-6">
            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden h-full flex flex-col justify-between">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div>
                <p className="text-indigo-100 font-medium mb-1">Total Gasto no Mês</p>
                <div className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                  R$ {totalExpenses.toFixed(2)}
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm text-indigo-100 font-medium">
                  <span>Orçamento Usado: {progressPercent.toFixed(1)}%</span>
                  <span>Meta: R$ {metaGastos.toFixed(0)}</span>
                </div>
                <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${progressPercent > 90 ? 'bg-rose-400' : progressPercent > 70 ? 'bg-yellow-400' : 'bg-emerald-400'}`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Cards Individuais */}
          <div className="lg:col-span-3 flex">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg w-full flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown size={48} />
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-2">Meu Gasto</h3>
              <div className="text-3xl font-bold text-white">R$ {myExpenses.toFixed(2)}</div>
            </div>
          </div>

          <div className="lg:col-span-3 flex">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg w-full flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown size={48} />
              </div>
              <h3 className="text-zinc-400 text-sm font-medium mb-2">Gasto do Parceiro</h3>
              <div className="text-3xl font-bold text-white">R$ {partnerExpenses.toFixed(2)}</div>
            </div>
          </div>

          {/* Evolução Mensal (Largura Total) */}
          <div className="lg:col-span-12 mt-2">
            <AreaChartCard transactions={txs} predictedTotal={predictedTotal} budgetLimit={metaGastos} />
          </div>

          {/* Lista de Gastos Recentes e Gráfico de Categorias */}
          <div className="lg:col-span-8">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 h-full">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4 flex items-center">
                <Receipt size={16} className="mr-2" />
                Últimas Despesas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentExpenses.length > 0 ? recentExpenses.map(tx => (
                  <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-lg">
                        {getCategoryIcon(tx.category)}
                      </div>
                      <div className="text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded-md text-sm">
                        - R$ {Number(tx.amount).toFixed(2)}
                      </div>
                    </div>
                    <p className="font-medium text-white line-clamp-1">{tx.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {tx.user_id === session.user.id ? 'Você' : partnerName} • {formatRelativeDate(tx.date)}
                    </p>
                  </div>
                )) : (
                  <div className="col-span-full text-center text-sm text-zinc-600 py-4">
                    Nenhuma despesa recente registrada.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-4">
            <ExpensePieChartCard transactions={txs} />
          </div>
        </div>
      </section>

      <AddTransactionModal />
    </div>
  );
}

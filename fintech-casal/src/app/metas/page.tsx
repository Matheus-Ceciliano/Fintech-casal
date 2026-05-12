import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Target } from "lucide-react";
import { GoalCard } from "@/components/GoalCard";
import { NewGoalModal } from "@/components/NewGoalModal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export default async function MetasPage() {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single();

  if (!profile || !profile.couple_id) redirect("/setup");

  // Fetch Goals e Perfis
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").eq("couple_id", profile.couple_id);
  const partnerProfile = profiles?.find(p => p.id !== session.user.id);
  const partnerName = partnerProfile ? partnerProfile.full_name?.split(" ")[0] : "Parceiro(a)";

  const { data: goals, error } = await supabase
    .from("goals")
    .select("*")
    .eq("couple_id", profile.couple_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar metas:", error);
  }

  const metas = goals || [];
  
  // Fetch Histórico de Depósitos
  const { data: depositsData } = await supabase
    .from("transactions")
    .select("*")
    .eq("couple_id", profile.couple_id)
    .in("category", ["Investimento", "Reserva"])
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12);

  const recentDeposits = depositsData || [];
  
  // Calculate Totals
  let totalSaved = 0;
  let totalTarget = 0;
  
  metas.forEach(goal => {
    totalSaved += Number(goal.current_amount);
    totalTarget += Number(goal.target_amount);
  });

  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 py-8 pb-32 space-y-10">
      
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cofrinho</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
            Seus objetivos financeiros a dois
          </p>
        </div>
        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-full">
          <Target size={24} />
        </div>
      </header>

      {/* Cabeçalho de Destaque */}
      <section className="bg-emerald-900/20 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-emerald-900/10">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <p className="text-emerald-400 font-semibold tracking-wider uppercase text-sm mb-2">Total no Cofrinho</p>
          <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter mb-6 drop-shadow-sm">
            R$ {totalSaved.toFixed(2)}
          </h2>
          
          <div className="w-full max-w-md bg-black/40 rounded-full h-4 overflow-hidden border border-zinc-800/50 shadow-inner">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-zinc-400 text-sm mt-3 font-medium">
            De um total desejado de R$ {totalTarget.toFixed(2)}
          </p>
        </div>
      </section>

      {/* Grid de Metas */}
      <section>
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-xl font-bold text-zinc-200">Metas Ativas</h2>
          <span className="bg-zinc-800 text-zinc-400 text-xs py-1 px-2 rounded-full font-bold">
            {metas.length}
          </span>
        </div>

        {metas.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="text-6xl mb-4 opacity-50">🐷</div>
            <h3 className="text-xl font-bold text-zinc-300 mb-2">Nenhuma meta criada</h3>
            <p className="text-zinc-500 max-w-sm mx-auto">
              Clique no botão + abaixo para criar a primeira meta do casal. Que tal a próxima viagem ou fundo de emergência?
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </section>

      {/* Histórico de Depósitos */}
      <section className="mt-12">
        <div className="flex items-center space-x-2 mb-6">
          <h2 className="text-xl font-bold text-zinc-200">Histórico de Depósitos</h2>
        </div>
        
        {recentDeposits.length > 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentDeposits.map(tx => (
                <div key={tx.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-emerald-500/30 transition-colors">
                  <div>
                    <p className="font-medium text-white">{tx.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {tx.user_id === session.user.id ? 'Você' : partnerName} • {formatRelativeDate(tx.date)}
                    </p>
                  </div>
                  <div className="font-bold text-emerald-400 mt-3 text-lg flex items-center">
                    <span className="text-sm mr-1">+ R$</span> {Number(tx.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800/50 border-dashed rounded-3xl p-10 text-center flex flex-col items-center">
            <p className="text-zinc-500 font-medium">Nenhum depósito guardado ainda.</p>
            <p className="text-zinc-600 text-sm mt-1">
              Quando você depositar marcando a opção "Subtrair do Saldo Geral", o histórico aparecerá aqui.
            </p>
          </div>
        )}
      </section>

      <NewGoalModal />
    </div>
  );
}

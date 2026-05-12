"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ArrowLeft, Receipt, Calendar, Filter } from "lucide-react";
import Link from "next/link";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", session.user.id)
        .single();

      if (!profile?.couple_id) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("couple_id", profile.couple_id)
        .order("date", { ascending: false });

      setTransactions(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      <header className="p-6 pt-12 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="p-2 bg-zinc-900 rounded-full text-zinc-400">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold">Transações</h1>
        </div>
        <button className="p-2 bg-zinc-900 rounded-full text-zinc-400">
          <Filter size={20} />
        </button>
      </header>

      <main className="px-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    <Receipt size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <div className="flex items-center space-x-2 text-[10px] text-zinc-500">
                      <Calendar size={10} />
                      <span>{new Date(tx.date).toLocaleDateString("pt-BR")}</span>
                      <span>•</span>
                      <span>{tx.category}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
              <Receipt size={32} />
            </div>
            <p className="text-zinc-500 text-sm">Nenhuma transação encontrada.</p>
          </div>
        )}
      </main>
    </div>
  );
}

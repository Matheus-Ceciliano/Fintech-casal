"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { addGoal } from "@/app/actions";
import { NumericFormat } from "react-number-format";

export function NewGoalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetAmount, setTargetAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await addGoal(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar meta.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Nova Meta</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex gap-4">
                <div className="w-1/4">
                  <label className="text-sm text-zinc-400 mb-1 block">Emoji</label>
                  <input 
                    type="text" 
                    name="emoji" 
                    defaultValue="🎯"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xl text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-zinc-400 mb-1 block">Nome da Meta</label>
                  <input 
                    type="text" 
                    name="title" 
                    required 
                    placeholder="Ex: Viagem para Paris"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Valor Alvo (R$)</label>
                <NumericFormat
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                  allowNegative={false}
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  required
                  onValueChange={(values) => {
                    setTargetAmount(values.value);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xl font-medium"
                />
                <input type="hidden" name="target_amount" value={targetAmount} />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Data Limite (Opcional)</label>
                <input 
                  type="date" 
                  name="deadline" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white font-medium py-4 rounded-xl hover:bg-emerald-500 active:scale-[0.98] transition-all flex justify-center items-center mt-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Criar Meta"}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

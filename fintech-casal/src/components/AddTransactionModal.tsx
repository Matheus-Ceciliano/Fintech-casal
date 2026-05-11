"use client";

import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { NumericFormat } from "react-number-format";
import { addTransaction } from "@/app/actions";

export function AddTransactionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      await addTransaction(formData);
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao adicionar transação.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {/* Backdrop & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/80 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-6 space-y-6 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
            
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white tracking-tight">Nova Transação</h2>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex gap-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value="expense" className="peer sr-only" defaultChecked />
                  <div className="text-center py-3 rounded-xl border border-zinc-800 text-zinc-400 peer-checked:bg-rose-500/10 peer-checked:text-rose-500 peer-checked:border-rose-500/30 font-medium transition-colors">
                    Despesa
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" value="income" className="peer sr-only" />
                  <div className="text-center py-3 rounded-xl border border-zinc-800 text-zinc-400 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-500 peer-checked:border-emerald-500/30 font-medium transition-colors">
                    Receita
                  </div>
                </label>
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Valor (R$)</label>
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
                    setAmount(values.value);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-xl font-medium"
                />
                <input type="hidden" name="amount" value={amount} />
              </div>

              <div>
                <label className="text-sm text-zinc-400 mb-1 block">Descrição</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  placeholder="Ex: Compra no Mercado"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-zinc-400 mb-1 block">Data</label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    defaultValue={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-zinc-400 mb-1 block">Categoria</label>
                  <select 
                    name="category" 
                    required 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none appearance-none"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Mercado">Mercado</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Viagem">Viagem</option>
                    <option value="Salário">Salário</option>
                    <option value="Investimento">Investimento</option>
                    <option value="Reserva">Reserva</option>
                    <option value="Dívida">Dívida</option>
                    <option value="Empréstimo">Empréstimo</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input 
                  type="checkbox" 
                  id="is_shared" 
                  name="is_shared" 
                  value="true" 
                  defaultChecked 
                  className="w-5 h-5 rounded border-zinc-700 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-zinc-900 bg-zinc-950"
                />
                <label htmlFor="is_shared" className="text-sm text-zinc-300">
                  Despesa compartilhada do casal
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white font-medium py-4 rounded-xl hover:bg-indigo-500 active:scale-[0.98] transition-all flex justify-center items-center mt-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Salvar Transação"}
              </button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}

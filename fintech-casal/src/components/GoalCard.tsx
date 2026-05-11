"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, X, Loader2, Calendar } from "lucide-react";
import { depositToGoal, withdrawFromGoal } from "@/app/actions";
import { NumericFormat } from "react-number-format";

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline: string | null;
}

export function GoalCard({ goal }: { goal: Goal }) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const progressPercent = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

  const handleDeposit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("goal_id", goal.id);
      await depositToGoal(formData);
      setIsDepositOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao realizar depósito.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("goal_id", goal.id);
      await withdrawFromGoal(formData);
      setIsWithdrawOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Erro ao realizar resgate.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeLeft = (deadline: string | null) => {
    if (!deadline) return null;
    const end = new Date(deadline);
    const now = new Date();
    
    const diffTime = end.getTime() - now.getTime();
    if (diffTime <= 0) return "Encerrado";
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      return `Faltam ${months} ${months === 1 ? 'mês' : 'meses'}`;
    }
    return `Faltam ${diffDays} dias`;
  };

  const timeLeft = calculateTimeLeft(goal.deadline);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg relative overflow-hidden group flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-2xl shadow-inner">
            {goal.emoji}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{goal.title}</h3>
            {timeLeft && (
              <p className="text-xs text-zinc-500 flex items-center mt-0.5">
                <Calendar size={12} className="mr-1" />
                {timeLeft}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 transition-colors"
            title="Resgatar"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={() => setIsDepositOpen(true)}
            className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
            title="Depositar"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <span className="text-white">R$ {Number(goal.current_amount).toFixed(2)}</span>
          <span className="text-zinc-500">R$ {Number(goal.target_amount).toFixed(2)}</span>
        </div>
        
        <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden shadow-inner">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full relative ${progressPercent >= 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-emerald-400'}`}
          >
            <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
          </motion.div>
        </div>
        
        <p className="text-right text-xs text-zinc-500 font-medium">
          {progressPercent.toFixed(1)}% concluído
        </p>
      </div>

      {/* Mini-Modal de Depósito */}
      {isDepositOpen && (
        <div className="absolute inset-0 z-10 bg-zinc-900/95 backdrop-blur-md p-5 flex flex-col justify-center animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-emerald-400">Depositar</h4>
            <button onClick={() => setIsDepositOpen(false)} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
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
                  setDepositAmount(values.value);
                }}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-center text-xl font-bold"
              />
              <input type="hidden" name="amount" value={depositAmount} />
            </div>
            
            <div className="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-zinc-800/50">
              <input 
                type="checkbox" 
                id={`deduct_${goal.id}`} 
                name="deduct_from_balance" 
                value="true" 
                defaultChecked 
                className="w-5 h-5 rounded border-zinc-700 text-emerald-600 focus:ring-emerald-600 mt-0.5 bg-zinc-900"
              />
              <label htmlFor={`deduct_${goal.id}`} className="text-xs text-zinc-300 leading-tight">
                Subtrair do Saldo Geral (Cria uma despesa de 'Investimento' no Dashboard)
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 text-white font-medium py-3 rounded-xl hover:bg-emerald-500 transition-all flex justify-center items-center shadow-lg shadow-emerald-900/20"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Confirmar Depósito"}
            </button>
          </form>
        </div>
      )}

      {/* Mini-Modal de Resgate */}
      {isWithdrawOpen && (
        <div className="absolute inset-0 z-10 bg-zinc-900/95 backdrop-blur-md p-5 flex flex-col justify-center animate-in fade-in duration-200">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-zinc-200">Resgatar</h4>
            <button onClick={() => setIsWithdrawOpen(false)} className="text-zinc-500 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <NumericFormat
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                isAllowed={(values) => {
                  const { floatValue } = values;
                  return floatValue === undefined || floatValue <= goal.current_amount;
                }}
                inputMode="numeric"
                placeholder="R$ 0,00"
                required
                onValueChange={(values) => {
                  setWithdrawAmount(values.value);
                }}
                className="w-full bg-black/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 outline-none text-center text-xl font-bold"
              />
              <input type="hidden" name="amount" value={withdrawAmount} />
            </div>
            
            <div className="flex items-start space-x-3 bg-black/20 p-3 rounded-lg border border-zinc-800/50">
              <input 
                type="checkbox" 
                id={`add_${goal.id}`} 
                name="add_to_balance" 
                value="true" 
                defaultChecked 
                className="w-5 h-5 rounded border-zinc-700 text-emerald-600 focus:ring-emerald-600 mt-0.5 bg-zinc-900"
              />
              <label htmlFor={`add_${goal.id}`} className="text-xs text-zinc-300 leading-tight">
                Devolver ao Saldo Geral (Cria uma receita no Dashboard)
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-800 text-white font-medium py-3 rounded-xl hover:bg-zinc-700 transition-all flex justify-center items-center shadow-lg"
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Confirmar Resgate"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

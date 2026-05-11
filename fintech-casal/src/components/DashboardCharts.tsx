"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Transaction = {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
};

export function DashboardCharts({ 
  transactions, 
  predictedTotal, 
  budgetLimit = 5000 
}: { 
  transactions: Transaction[], 
  predictedTotal: number, 
  budgetLimit?: number 
}) {
  
  // 1. Processar dados para o Gráfico de Área (Evolução de Gastos Diários)
  const areaData = useMemo(() => {
    // Filtra apenas despesas do mês atual e ordena por data
    const expenses = transactions
      .filter(t => t.type === "expense")
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const today = new Date().getDate();
    let accumulated = 0;
    
    // Agrupar gastos por dia primeiro
    const expensesByDay: Record<number, number> = {};
    expenses.forEach(t => {
      // Pega os últimos 2 dígitos (dia) ignorando timezone issues, assumindo formato YYYY-MM-DD
      const day = parseInt(t.date.split('-')[2], 10); 
      expensesByDay[day] = (expensesByDay[day] || 0) + Number(t.amount);
    });

    const dailyData = [];
    
    // Preencher array do dia 1 até o dia atual para garantir que a linha não caia/pule dias
    for (let i = 1; i <= today; i++) {
      if (expensesByDay[i]) {
        accumulated += expensesByDay[i];
      }
      dailyData.push({
        day: `${i}`,
        total: Math.round(accumulated)
      });
    }

    return dailyData;
  }, [transactions]);

  // 2. Processar dados para o Gráfico de Rosca (Categorias)
  const pieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === "expense");
    const categoryTotals: Record<string, number> = {};

    expenses.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
    });

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Lógica de Cor do Gráfico (Sense of Urgency)
  let lineColor = "#10b981"; // Emerald (Verde) - Safe
  if (predictedTotal > budgetLimit) {
    lineColor = "#f43f5e"; // Rose (Vermelho) - Danger
  } else if (predictedTotal > budgetLimit * 0.8) {
    lineColor = "#eab308"; // Yellow (Amarelo) - Warning
  }

  // Cores da Rosca (Donut)
  const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#10b981", "#06b6d4"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Gráfico de Área */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg h-full flex flex-col">
        <h3 className="text-zinc-400 text-sm font-medium mb-4">Evolução Mensal de Gastos</h3>
        
        {areaData.length > 0 ? (
          <div className="h-64 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke={lineColor} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-zinc-600 text-sm flex-grow">
            Nenhuma despesa registrada neste mês.
          </div>
        )}
      </div>

      {/* Gráfico de Rosca */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg h-full flex flex-col">
        <h3 className="text-zinc-400 text-sm font-medium mb-4">Gastos por Categoria</h3>
        
        {pieData.length > 0 ? (
          <div className="h-64 w-full relative flex items-center justify-center flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Texto Central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-zinc-500">Total</span>
              <span className="text-lg font-bold text-white">
                R$ {pieData.reduce((acc, curr) => acc + curr.value, 0).toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-zinc-600 text-sm flex-grow">
            Sem dados para categorias.
          </div>
        )}
      </div>

    </div>
  );
}

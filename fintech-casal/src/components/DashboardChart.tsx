"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface TimelineItem { day: string; receitas: number; despesas: number; }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>Dia {label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(p.value)}
        </div>
      ))}
    </div>
  );
};

export function DashboardChart({ data }: { data: TimelineItem[] }) {
  const hasData = data.some(d => d.receitas > 0 || d.despesas > 0);
  if (!hasData) {
    return (
      <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-muted)", fontSize: 14 }}>
        📈 Nenhum dado para o gráfico neste período.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false}
          ticks={data.filter((_, i) => i % 5 === 0).map(d => d.day)} />
        <YAxis tickFormatter={(v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}k` : `R$${v.toFixed(0)}`}
          tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#1B7A4B" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#E0457B" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

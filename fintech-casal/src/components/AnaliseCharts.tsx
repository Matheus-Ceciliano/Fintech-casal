"use client";

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

interface CategoryItem { name: string; value: number; icon: string; }
interface PersonItem { name: string; value: number; color: string; }
interface TimelineItem { day: string; receitas: number; despesas: number; }

interface Props {
  categoryData: CategoryItem[];
  personData: PersonItem[];
  timelineData: TimelineItem[];
  myName: string;
  partnerName: string;
  totalExpenses: number;
}

const GRADIENT_COLORS = ['#FF6B6B', '#C850C0', '#4158D0', '#a78bfa', '#34d399', '#fbbf24', '#38bdf8'];

function fmtCurrency(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`;
  return `R$${v.toFixed(0)}`;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-color)',
      borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    }}>
      {label && <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Dia {label}</div>}
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 13, fontWeight: 700, color: p.color }}>
          {p.name}: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.value)}
        </div>
      ))}
    </div>
  );
};

export function AnaliseCharts({ categoryData, personData, timelineData, totalExpenses }: Props) {
  const hasCategories = categoryData.length > 0;
  const hasPerson = personData.length > 0;
  const hasTimeline = timelineData.some(d => d.receitas > 0 || d.despesas > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

      {/* Category donut */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">Gastos por Categoria</div>
        {!hasCategories ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <span className="empty-state-icon">🥧</span>
            <p>Sem despesas no período.</p>
          </div>
        ) : (
          <>
            <div style={{ width: "100%", maxWidth: 280, margin: "0 auto", height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val),
                      name,
                    ]}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              {categoryData.map((item, i) => {
                const pct = totalExpenses > 0 ? (item.value / totalExpenses * 100).toFixed(1) : '0';
                return (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: GRADIENT_COLORS[i % GRADIENT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>{item.icon} {item.name}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{pct}%</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* By person bar chart */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">Gastos por Pessoa</div>
        {!hasPerson ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <span className="empty-state-icon">👥</span>
            <p>Sem dados de gastos por pessoa.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={personData} barSize={48} layout="vertical">
              <XAxis type="number" tickFormatter={fmtCurrency} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: 'var(--text-primary)' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
              <Bar dataKey="value" name="Despesas" radius={[0, 8, 8, 0]}>
                {personData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Timeline line chart */}
      <div className="card" style={{ padding: 20 }}>
        <div className="section-title">Linha do Tempo do Mês</div>
        {!hasTimeline ? (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <span className="empty-state-icon">📈</span>
            <p>Nenhum dado no período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}
                ticks={timelineData.filter((_, i) => i % 5 === 0).map(d => d.day)} />
              <YAxis tickFormatter={fmtCurrency} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#34d399" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#fb7185" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

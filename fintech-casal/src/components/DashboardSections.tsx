"use client";
import { useState } from "react";
import Link from "next/link";
import { DashboardChart } from "./DashboardChart";

const CATEGORY_ICONS: Record<string, string> = {
  Alimentação:"🍔",Mercado:"🛒",Moradia:"🏠",Transporte:"⛽",
  Saúde:"💊",Lazer:"🍿",Viagem:"✈️",Salário:"💰",
  Investimento:"📈",Reserva:"🐷",Dívida:"📉",Empréstimo:"🏦",Outros:"📦",
};

function fmt(v: number) { return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v); }
function fmtDate(d: string) { return new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short"}).format(new Date(d+"T00:00:00")); }
function mask(v: number, h: boolean) { return h ? "••••••" : fmt(v); }

interface Tx { id:string; description:string; amount:number; date:string; userId:string; category:string; }
interface Cat { cat:string; val:number; icon:string; }
interface Debt { id:string; title:string; amount:number; dueDate:string; userName:string; avatarUrl?:string|null; }
interface PaidDebt { id:string; title:string; amount:number; paidAt:string; userName:string; avatarUrl?:string|null; }
interface Goal { id:string; title:string; current:number; target:number; emoji:string; }
interface TimelineItem { day:string; receitas:number; despesas:number; }

export interface DashboardSectionsProps {
  hidden: boolean;
  myName: string; partnerName: string; myId: string;
  myIncome: number; partnerIncome: number; myIncPct: number; partnerIncPct: number;
  myExpenses: number; partnerExpenses: number; myExpPct: number; partnerExpPct: number;
  totalIncome: number; totalExpenses: number; prevMonthIncome: number; prevMonthExpenses: number;
  recentIncomes: Tx[]; recentExpenses: Tx[];
  topCategories: Cat[];
  upcomingDebts: Debt[]; paidThisMonth: PaidDebt[]; hasDebtsTable: boolean;
  goals: Goal[];
  timelineData: TimelineItem[];
  inviteCode: string | null;
}

export function DashboardSections(p: DashboardSectionsProps) {
  const { hidden: h } = p;
  const sectionTitle = (t: string) => (
    <div style={{ marginTop:40, marginBottom:20 }}>
      <h2 style={{ fontSize:18, fontWeight:600, color:"var(--text-primary)", margin:"0 0 8px" }}>{t}</h2>
      <div style={{ height:1, background:"var(--border-color)" }} />
    </div>
  );

  return (
    <>
      {/* ── SEÇÃO 2: CONVITE ── */}
      {p.inviteCode && (
        <div style={{ marginTop:32 }}>
          <InviteCard code={p.inviteCode} />
        </div>
      )}

      {/* ── SEÇÃO 3: PATRIMÔNIO E ENTRADAS ── */}
      {sectionTitle("Patrimônio e Entradas")}
      <div className="card" style={{ padding:24, marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Total entrado no mês</div>
        <div style={{ fontSize:32, fontWeight:700, color:"#10B981" }}>{h?"••••••":fmt(p.totalIncome)}</div>
        {p.prevMonthIncome > 0 && (
          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
            ▲ {p.totalIncome >= p.prevMonthIncome ? "+" : "-"}{Math.abs(((p.totalIncome - p.prevMonthIncome) / p.prevMonthIncome) * 100).toFixed(0)}% em relação ao mês anterior
          </div>
        )}
      </div>
      <div className="dashboard-grid">
        {/* Contribuição */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 16px", color:"var(--text-primary)" }}>Contribuição do Casal</h3>
          <div style={{ height:10, background:"var(--border-subtle)", borderRadius:100, overflow:"hidden", display:"flex", marginBottom:16 }}>
            <div style={{ width:`${p.myIncPct}%`, background:"linear-gradient(90deg,#C850C0,#E0457B)", borderRadius:"100px 0 0 100px", transition:"width 0.8s" }} />
            <div style={{ flex:1, background:"linear-gradient(90deg,#4158D0,#6C4FD4)", borderRadius:"0 100px 100px 0" }} />
          </div>
          {[
            { name:p.myName, val:p.myIncome, pct:p.myIncPct, color:"#C850C0" },
            { name:p.partnerName, val:p.partnerIncome, pct:p.partnerIncPct, color:"#4158D0" },
          ].map(person => (
            <div key={person.name} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", background:`${person.color}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:person.color }}>
                {person.name[0]}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{person.name}</div>
                <div style={{ fontSize:12, color:"var(--text-muted)" }}>{h?"••••":fmt(person.val)} — {person.pct}%</div>
              </div>
            </div>
          ))}
        </div>
        {/* Últimas entradas */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, margin:0, color:"var(--text-primary)" }}>Últimas Entradas</h3>
            <Link href="/transactions?type=income" style={{ fontSize:12, fontWeight:600, color:"var(--brand-primary)", textDecoration:"none" }}>Ver todas →</Link>
          </div>
          {p.recentIncomes.length === 0 ? (
            <p style={{ fontSize:13, color:"var(--text-muted)", textAlign:"center", padding:"16px 0" }}>Nenhuma receita este mês.</p>
          ) : p.recentIncomes.map(tx => (
            <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)" }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:"var(--income-bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--income-color)" }}>
                {tx.userId===p.myId?p.myName[0]:p.partnerName[0]}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.description}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)" }}>{tx.userId===p.myId?p.myName:p.partnerName} · {fmtDate(tx.date)}</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--income-color)", flexShrink:0 }}>+{h?"••••":fmt(tx.amount)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── SEÇÃO 4: DESPESAS ── */}
      {sectionTitle("Despesas do Casal")}
      <div className="metrics-row" style={{ marginBottom:20 }}>
        <MetricMini label="Total Gasto" value={p.totalExpenses} color="var(--expense-color)" hidden={h}
          sub={p.prevMonthExpenses>0 ? `${p.totalExpenses>p.prevMonthExpenses?"▲":"▼"} ${Math.abs(((p.totalExpenses-p.prevMonthExpenses)/p.prevMonthExpenses)*100).toFixed(0)}% vs mês anterior` : undefined} />
        <MetricMini label="Meus Gastos" value={p.myExpenses} color="#C850C0" hidden={h} sub={`${p.myExpPct}% do total`} />
        <MetricMini label={`Gastos ${p.partnerName}`} value={p.partnerExpenses} color="#4158D0" hidden={h} sub={`${p.partnerExpPct}% do total`} />
      </div>
      <div className="dashboard-grid">
        {/* Últimas despesas */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <h3 style={{ fontSize:14, fontWeight:700, margin:0, color:"var(--text-primary)" }}>Últimas Despesas</h3>
            <Link href="/transactions?type=expense" style={{ fontSize:12, fontWeight:600, color:"var(--brand-primary)", textDecoration:"none" }}>Ver todas →</Link>
          </div>
          {p.recentExpenses.length === 0 ? (
            <p style={{ fontSize:13, color:"var(--text-muted)", textAlign:"center", padding:"16px 0" }}>Nenhuma despesa este mês.</p>
          ) : p.recentExpenses.map(tx => (
            <div key={tx.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)" }}>
              <div className="cat-icon" style={{ width:36, height:36, borderRadius:10, background:"var(--expense-bg)", fontSize:16 }}>
                {CATEGORY_ICONS[tx.category]||"💸"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tx.description}</div>
                <div style={{ fontSize:11, color:"var(--text-muted)" }}>{tx.userId===p.myId?p.myName:p.partnerName} · {fmtDate(tx.date)}</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--expense-color)", flexShrink:0 }}>-{h?"••••":fmt(tx.amount)}</span>
            </div>
          ))}
        </div>
        {/* Categorias */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:14, fontWeight:700, margin:"0 0 16px", color:"var(--text-primary)" }}>Gastos por Categoria</h3>
          {p.topCategories.length===0 ? (
            <p style={{ fontSize:13, color:"var(--text-muted)", textAlign:"center", padding:"16px 0" }}>Sem dados de categoria.</p>
          ) : p.topCategories.map(c => {
            const pct = p.totalExpenses>0?(c.val/p.totalExpenses)*100:0;
            return (
              <div key={c.cat} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:16 }}>{c.icon}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{c.cat}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--expense-color)" }}>{h?"••••":fmt(c.val)}</span>
                    <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:6 }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="progress-track" style={{ height:6 }}>
                  <div className="progress-fill" style={{ width:`${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEÇÃO 5: DÍVIDAS ── */}
      {p.hasDebtsTable && (<>
        {sectionTitle("Dívidas")}
        <div className="dashboard-grid">
          <div className="card" style={{ background:"var(--bg-card)", borderRadius:16, boxShadow:"var(--shadow-card)", padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 12px", color:"var(--dashboard-block-title)" }}>Próximas a vencer</h3>
            {p.upcomingDebts.length===0 ? <p style={{ fontSize:13, color:"var(--text-muted)", margin:"16px 0" }}>Nenhuma dívida vencendo em breve ✓</p> :
              p.upcomingDebts.map(d => {
                const today = new Date(); today.setHours(0,0,0,0);
                const due = new Date(d.dueDate + "T00:00:00");
                const diff = Math.round((due.getTime() - today.getTime()) / 864e5);
                const urgent = diff <= 1;
                return (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)" }}>
                    <UserAvatar name={d.userName} avatarUrl={d.avatarUrl} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{d.title}</div>
                      <div style={{ fontSize:11, color:"var(--text-muted)" }}>{d.userName} · Vence {fmtDate(d.dueDate)}</div>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:"var(--expense-color)" }}>{h?"••••":fmt(d.amount)}</span>
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100,
                      background:urgent?"var(--debt-badge-red-bg)":"var(--debt-badge-yellow-bg)",
                      color:urgent?"var(--debt-badge-red-text)":"var(--debt-badge-yellow-text)" }}>
                      {urgent?"Urgente":"Em breve"}
                    </span>
                  </div>
                );
              })
            }
          </div>
          <div className="card" style={{ background:"var(--bg-card)", borderRadius:16, boxShadow:"var(--shadow-card)", padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:600, margin:"0 0 12px", color:"var(--dashboard-block-title)" }}>Pagas este mês</h3>
            {p.paidThisMonth.length===0 ? <p style={{ fontSize:13, color:"var(--text-muted)", margin:"16px 0" }}>Nenhuma dívida paga este mês</p> :
              p.paidThisMonth.map(d => (
                <div key={d.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid var(--border-subtle)" }}>
                  <UserAvatar name={d.userName} avatarUrl={d.avatarUrl} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{d.title}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>{d.userName} · Pago em {fmtDate(d.paidAt)}</div>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:"var(--income-color)" }}>✓ {h?"••••":fmt(d.amount)}</span>
                  <span style={{ fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:100, background:"var(--debt-badge-green-bg)", color:"var(--debt-badge-green-text)" }}>Pago</span>
                </div>
              ))
            }
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <Link href="/dividas" style={{ fontSize:13, fontWeight:600, color:"var(--brand-primary)", textDecoration:"none" }}>Ver todas as dívidas →</Link>
        </div>
      </>)}

      {/* ── SEÇÃO 6: COFRINHOS ── */}
      {sectionTitle("Cofrinhos")}
      {p.goals.length===0 ? (
        <div className="card" style={{ padding:24, textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🐷</div>
          <p style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)", margin:"0 0 4px" }}>Nenhum cofrinho</p>
          <p style={{ fontSize:13, color:"var(--text-muted)", margin:0 }}>Crie um na aba Cofrinho.</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          {p.goals.map(g => {
            const pct=g.target>0?Math.min((g.current/g.target)*100,100):0;
            return (
              <div key={g.id} className="card" style={{ padding:20 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <span style={{ fontSize:28 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{g.title}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted)" }}>{pct.toFixed(0)}% concluído</div>
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:15, fontWeight:700, color:"var(--savings-color)" }}>{h?"••••":fmt(g.current)}</span>
                  <span style={{ fontSize:12, color:"var(--text-muted)" }}>de {h?"••••":fmt(g.target)}</span>
                </div>
                <div className="progress-track" style={{ height:6 }}>
                  <div className="progress-fill" style={{ width:`${pct}%`, background:"linear-gradient(90deg,#a78bfa,#C850C0)" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ marginTop:12 }}>
        <Link href="/metas" style={{ fontSize:13, fontWeight:600, color:"var(--brand-primary)", textDecoration:"none" }}>Gerenciar cofrinhos →</Link>
      </div>

      {/* ── SEÇÃO 7: EVOLUÇÃO MENSAL ── */}
      {sectionTitle("Evolução Mensal")}
      <div className="card" style={{ padding:24 }}>
        <DashboardChart data={p.timelineData} />
      </div>
    </>
  );
}

/* ── Small helpers ── */
function MetricMini({ label, value, color, hidden, sub }: { label:string; value:number; color:string; hidden:boolean; sub?:string }) {
  return (
    <div className="card" style={{ padding:18, borderLeft:`4px solid ${color}` }}>
      <div style={{ fontSize:11, fontWeight:600, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:700, color }}>{hidden?"••••••":fmt(value)}</div>
      {sub && <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function UserAvatar({ name, avatarUrl }: { name:string; avatarUrl?:string|null }) {
  return avatarUrl ? (
    <img src={avatarUrl} alt={name} style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
  ) : (
    <div style={{ width:32, height:32, borderRadius:"50%", background:"var(--brand-active-bg)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"var(--brand-primary)", flexShrink:0 }}>
      {name[0] || "?"}
    </div>
  );
}

function InviteCard({ code }: { code:string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2000); }); };
  return (
    <div className="card dashboard-invite-card" style={{ padding:20, display:"flex", alignItems:"center", gap:16 }}>
      <div style={{ width:40, height:40, borderRadius:12, background:"rgba(200,80,192,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>👥</div>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Convide seu(sua) parceiro(a)!</div>
        <div style={{ fontSize:12, color:"var(--text-muted)" }}>Compartilhe o código abaixo</div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:8 }}>
          <code style={{ fontSize:18, fontWeight:800, letterSpacing:"0.15em", color:"#C850C0" }}>{code}</code>
          <button onClick={handleCopy} style={{ background:copied?"var(--income-bg)":"rgba(200,80,192,0.1)", border:"none", borderRadius:8, padding:"4px 12px", cursor:"pointer", fontSize:12, fontWeight:700, color:copied?"var(--income-color)":"#C850C0" }}>
            {copied?"Copiado!":"Copiar"}
          </button>
        </div>
        <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>O código pode ser usado somente uma vez</div>
      </div>
    </div>
  );
}

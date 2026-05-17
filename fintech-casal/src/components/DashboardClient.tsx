"use client";

import { useState } from "react";
import { Eye, EyeOff, PiggyBank } from "lucide-react";
import { DashboardSections } from "./DashboardSections";

interface Tx { id:string; description:string; amount:number; date:string; userId:string; category:string; }
interface Cat { cat:string; val:number; icon:string; }
interface Debt { id:string; title:string; amount:number; dueDate:string; userName:string; avatarUrl?:string|null; }
interface PaidDebt { id:string; title:string; amount:number; paidAt:string; userName:string; avatarUrl?:string|null; }
interface Goal { id:string; title:string; current:number; target:number; emoji:string; }
interface TimelineItem { day:string; receitas:number; despesas:number; }

interface Props {
  myName: string; partnerName: string; myId: string;
  netBalance: number; totalIncome: number; totalExpenses: number;
  totalSaved: number; savingsRate: number;
  myExpenses: number; partnerExpenses: number; myExpPct: number; partnerExpPct: number;
  myIncome: number; partnerIncome: number; myIncPct: number; partnerIncPct: number;
  prevMonthIncome: number; prevMonthExpenses: number;
  recentIncomes: Tx[]; recentExpenses: Tx[];
  topCategories: Cat[];
  timelineData: TimelineItem[];
  goals: Goal[];
  upcomingDebts: Debt[]; paidThisMonth: PaidDebt[]; hasDebtsTable: boolean;
  inviteCode: string | null;
  avatarUrl?: string | null;
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtCompact(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v);
}
function fmtNum(v: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

/** Get first + last initials from full name */
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DashboardClient(p: Props) {
  const [hidden, setHidden] = useState(false);
  const h = hidden;

  return (
    <div className="dashboard-container" style={{ padding: "0 32px 48px" }}>
      {/* ═══ SEÇÃO 1 — VISÃO RÁPIDA ═══ */}
      <div
        style={{
          background: "var(--dashboard-hero-bg)",
          borderRadius: 28,
          padding: "32px 28px 28px",
          marginTop: 24,
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Decorative shapes */}
        <div style={{ position:"absolute", top:-60, right:-40, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.15)", filter:"blur(40px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.1)", filter:"blur(30px)", pointerEvents:"none" }} />

        {/* Unified Glassmorphism card */}
        <div
          className="quick-glance-card"
          style={{
            background: "var(--dashboard-glass-bg)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "var(--dashboard-glass-border)",
            borderRadius: 24,
            padding: "28px 32px",
            position: "relative",
            zIndex: 1,
            boxShadow: "0 8px 40px rgba(100, 80, 200, 0.12)",
            overflow: "hidden",
          }}
        >
          {/* Card header: avatar + name + Ocultar button */}
          <div className="quick-glance-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {p.avatarUrl ? (
                <img
                  src={p.avatarUrl}
                  alt={p.myName}
                  style={{
                    width: 42, height: 42, borderRadius: "50%",
                    border: "2px solid white",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{
                  width: 42, height: 42, borderRadius: "50%",
                  background: "linear-gradient(135deg, #C850C0, #4158D0)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "2px solid white",
                  fontSize: 15, color: "white", fontWeight: 700,
                  letterSpacing: "0.5px",
                }}>
                  {getInitials(p.myName)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 13, color: "var(--dashboard-hero-muted)", fontWeight: 500 }}>Boas-vindas,</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--dashboard-hero-text)" }}>{p.myName}</div>
              </div>
            </div>
            <button
              className="ocultar-btn"
              onClick={() => setHidden(!h)}
              style={{
                background: "var(--dashboard-mini-bg)",
                border: "var(--dashboard-mini-border)",
                borderRadius: 20, cursor: "pointer",
                color: "var(--dashboard-hero-muted)", padding: "5px 14px",
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 13, fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              {h ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="ocultar-text">{h ? "Mostrar" : "Ocultar"}</span>
            </button>
          </div>

          {/* VISÃO RÁPIDA label */}
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--dashboard-hero-muted)" }}>
              Visão Rápida
            </span>
          </div>

          {/* Saldo */}
          <div style={{ fontSize: 12, color: "var(--dashboard-hero-muted)", marginBottom: 2, fontWeight: 500 }}>Saldo do Mês</div>
          <div className="quick-glance-saldo" style={{
            fontSize: "clamp(28px, 8vw, 52px)", fontWeight: 800, letterSpacing: "-0.5px",
            color: "#5B4FCF",
            transition: "opacity 0.3s",
            wordBreak: "break-word",
          }}>
            {h ? "R$ ••••••" : fmt(p.netBalance)}
          </div>
          <div style={{
            fontSize: 15, fontWeight: 500, marginTop: 4, marginBottom: 24,
            color: p.savingsRate >= 0 ? "#059669" : "#DC2626",
          }}>
            {p.savingsRate >= 0 ? "▲" : "▼"} {Math.abs(p.savingsRate).toFixed(1)}% de economia
          </div>

          {/* Divider line before mini-cards */}
          <div style={{ height: 1, borderTop: "1px solid var(--dashboard-divider-color)", marginBottom: 16 }} />

          {/* 3 mini-cards DESKTOP */}
          <div className="quick-glance-minicards-desktop" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "Receitas", icon: "↑", val: p.totalIncome, color: "#059669" },
              { label: "Despesas", icon: "↓", val: p.totalExpenses, color: "#DC2626" },
              { label: "Cofrinho", icon: null, val: p.totalSaved, color: "#4F46E5", piggy: true },
            ].map(item => (
              <div key={item.label} className="quick-glance-minicard" style={{
                background: "var(--dashboard-mini-bg)",
                border: "var(--dashboard-mini-border)",
                borderRadius: 14, padding: "var(--dashboard-mini-padding)",
                minWidth: 0,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  {item.piggy ? <PiggyBank size={13} color="#4F46E5" /> : <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.icon}</span>}
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--dashboard-hero-text)", whiteSpace: "nowrap" }}>{item.label}</span>
                </div>
                <div className="quick-glance-minicard-val" style={{ fontSize: "clamp(16px, 4.5vw, 22px)", fontWeight: 700, color: item.color, transition: "opacity 0.3s", wordBreak: "break-all" }}>
                  {h ? "••••" : fmtCompact(item.val)}
                </div>
              </div>
            ))}
          </div>

          {/* 3 mini-cards MOBILE (hidden on desktop via CSS) */}
          <div className="quick-glance-minicards-mobile" style={{ display: "none", gridTemplateColumns: "1fr 1fr", gap: 8, overflow: "hidden" }}>
            {[
              { label: "Receitas", icon: "↑", val: p.totalIncome, color: "#059669" },
              { label: "Despesas", icon: "↓", val: p.totalExpenses, color: "#DC2626" },
              { label: "Cofrinho", icon: null, val: p.totalSaved, color: "#4F46E5", piggy: true },
            ].map(item => (
              <div key={item.label} className="quick-glance-minicard-mob" style={{
                background: "var(--dashboard-mini-bg)",
                border: "var(--dashboard-mini-border)",
                borderRadius: 14, padding: "12px 14px",
                minWidth: 0,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {item.piggy ? <PiggyBank size={13} color="#4F46E5" /> : <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.icon}</span>}
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280", whiteSpace: "nowrap" }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280" }}>R$</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: item.color, transition: "opacity 0.3s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {h ? "••••" : fmtNum(item.val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SEÇÕES 2-7 ═══ */}
      <DashboardSections
        hidden={h}
        myName={p.myName}
        partnerName={p.partnerName}
        myId={p.myId}
        myIncome={p.myIncome}
        partnerIncome={p.partnerIncome}
        myIncPct={p.myIncPct}
        partnerIncPct={p.partnerIncPct}
        totalIncome={p.totalIncome}
        prevMonthIncome={p.prevMonthIncome}
        myExpenses={p.myExpenses}
        partnerExpenses={p.partnerExpenses}
        myExpPct={p.myExpPct}
        partnerExpPct={p.partnerExpPct}
        totalExpenses={p.totalExpenses}
        prevMonthExpenses={p.prevMonthExpenses}
        recentIncomes={p.recentIncomes}
        recentExpenses={p.recentExpenses}
        topCategories={p.topCategories}
        upcomingDebts={p.upcomingDebts}
        paidThisMonth={p.paidThisMonth}
        hasDebtsTable={p.hasDebtsTable}
        goals={p.goals}
        timelineData={p.timelineData}
        inviteCode={p.inviteCode}
      />
    </div>
  );
}

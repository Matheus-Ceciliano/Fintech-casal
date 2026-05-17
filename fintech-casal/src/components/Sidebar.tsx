"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  CreditCard,
  BarChart3,
  Heart,
} from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft, exact: false },
  { href: "/metas", label: "Cofrinho", icon: PiggyBank, exact: false },
  { href: "/dividas", label: "Dívidas", icon: CreditCard, exact: false },
  { href: "/analise", label: "Análise", icon: BarChart3, exact: false },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100dvh",
        width: "var(--sidebar-width)",
        background: "var(--bg-card)",
        borderRight: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-sidebar)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        overflowY: "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "28px 24px 20px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--brand-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Heart size={18} color="white" fill="white" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.3px",
              }}
            >
              CasalFinance
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
              Finanças a dois
            </div>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: "16px 12px" }}>
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--text-muted)",
              paddingLeft: 12,
              display: "block",
              marginBottom: 8,
            }}
          >
            Menu
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    textDecoration: "none",
                    color: active ? "var(--brand-active-text)" : "var(--text-secondary)",
                    background: active ? "var(--brand-active-bg)" : "transparent",
                    fontWeight: active ? 600 : 500,
                    fontSize: 14,
                    transition: "all 0.15s",
                    position: "relative",
                  }}
                >
                  {/* Active left bar */}
                  {active && (
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "20%",
                        bottom: "20%",
                        width: 3,
                        borderRadius: "0 3px 3px 0",
                        background: "var(--brand-gradient)",
                      }}
                    />
                  )}
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 2}
                    style={{ flexShrink: 0 }}
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Profile link at bottom */}
      <div
        style={{
          padding: "16px 12px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderRadius: 10,
            textDecoration: "none",
            color: "var(--text-secondary)",
            background: "transparent",
            fontWeight: 500,
            fontSize: 14,
            transition: "all 0.15s",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--brand-gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 14 }}>👤</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Perfil
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Configurações
            </div>
          </div>
        </Link>
      </div>
    </aside>
  );
}

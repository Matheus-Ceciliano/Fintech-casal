"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowRightLeft, PiggyBank, CreditCard, BarChart3 } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft, exact: false },
  { href: "/metas", label: "Cofrinho", icon: PiggyBank, exact: false },
  { href: "/dividas", label: "Dívidas", icon: CreditCard, exact: false },
  { href: "/analise", label: "Análise", icon: BarChart3, exact: false },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <nav
      data-bottomnav="true"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--nav-height)",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border-color)",
        boxShadow: "var(--shadow-nav)",
        zIndex: 50,
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0px)",
      }}
    >
      <div
        style={{
          maxWidth: "430px",
          margin: "0 auto",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "0 4px",
        }}
      >
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                flex: 1,
                height: "100%",
                textDecoration: "none",
                position: "relative",
                transition: "all 0.2s",
              }}
            >
              {/* Active indicator bar */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    left: "20%",
                    right: "20%",
                    height: "2px",
                    borderRadius: "0 0 4px 4px",
                    background: "linear-gradient(135deg, #FF6B6B, #C850C0, #4158D0)",
                  }}
                />
              )}

              {/* Icon wrapper */}
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: active
                    ? "linear-gradient(135deg, rgba(255,107,107,0.15), rgba(200,80,192,0.15), rgba(65,88,208,0.15))"
                    : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{
                    color: active ? "#C850C0" : "var(--text-muted)",
                    transition: "color 0.2s",
                  }}
                />
              </span>

              <span
                style={{
                  fontSize: "10px",
                  fontWeight: active ? 700 : 500,
                  color: active ? "#C850C0" : "var(--text-muted)",
                  letterSpacing: "0.01em",
                  transition: "color 0.2s",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

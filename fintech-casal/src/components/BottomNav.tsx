"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, ArrowRightLeft, PiggyBank, CreditCard, Menu as MenuIcon, BarChart3, User, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/transactions", label: "Transações", icon: ArrowRightLeft, exact: false },
  { href: "/metas", label: "Cofrinho", icon: PiggyBank, exact: false },
  { href: "/dividas", label: "Dívidas", icon: CreditCard, exact: false },
  { href: "#menu", label: "Menu", icon: MenuIcon, exact: false, isMenu: true },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);

  function isActive(href: string, exact: boolean, isMenu?: boolean) {
    if (isMenu) return showMenu;
    if (exact) return pathname === href;
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <>
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
          {links.map(({ href, label, icon: Icon, exact, isMenu }) => {
            const active = isActive(href, exact, isMenu);
            const content = (
              <>
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
              </>
            );

            const commonStyle: React.CSSProperties = {
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
              cursor: "pointer",
              background: "none",
              border: "none",
              padding: 0,
              fontFamily: "inherit",
            };

            if (isMenu) {
              return (
                <button
                  key={label}
                  onClick={() => setShowMenu(!showMenu)}
                  style={commonStyle}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={href} href={href} style={commonStyle}>
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Expanded Menu Bottom Sheet */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 100,
                backdropFilter: "blur(4px)",
              }}
            />

            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                maxHeight: "70vh",
                background: "var(--bg-card)",
                borderRadius: "20px 20px 0 0",
                boxShadow: "0 -8px 32px rgba(0,0,0,0.15)",
                zIndex: 101,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                borderTop: "1px solid var(--border-color)",
                paddingBottom: "max(env(safe-area-inset-bottom, 16px), 16px)",
              }}
            >
              {/* Handle bar */}
              <div
                style={{
                  width: "100%",
                  padding: "12px 0 16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "grab",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    borderRadius: 2,
                    background: "var(--border-color)",
                  }}
                />
              </div>

              {/* Sheet Header */}
              <div
                style={{
                  padding: "0 20px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  Menu de Navegação
                </h3>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: "var(--border-subtle)",
                    border: "none",
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sheet Content / Links */}
              <div style={{ overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <Link
                  href="/analise"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 16px",
                    background: "var(--bg-primary)",
                    borderRadius: 16,
                    border: "1px solid var(--border-color)",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa" }}>
                    <BarChart3 size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15 }}>Análise Mensal</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>Gráficos e estatísticas de gastos</div>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "14px 16px",
                    background: "var(--bg-primary)",
                    borderRadius: 16,
                    border: "1px solid var(--border-color)",
                    textDecoration: "none",
                    color: "var(--text-primary)",
                    fontWeight: 600,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                    <User size={22} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15 }}>Meu Perfil & Segurança</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontWeight: 500 }}>PIN, biometria e preferências</div>
                  </div>
                  <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

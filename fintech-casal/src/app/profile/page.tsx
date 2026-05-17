"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, Bell, Moon, Sun, ChevronRight, Lock, Delete, Fingerprint, Users } from "lucide-react";
import { isPWA } from "@/lib/pwa";
import { hashPin, getStoredPinHash, setStoredPinHash, clearPin } from "@/lib/pin";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [coupleInfo, setCoupleInfo] = useState<{ invite_code?: string; member_count?: number } | null>(null);

  // PIN Setup
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [setupStep, setSetupStep] = useState<"create" | "confirm">("create");
  const [tempPin, setTempPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupError, setSetupError] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    setIsPwaActive(isPWA());
    setHasPin(!!getStoredPinHash());
    setHasBiometrics(localStorage.getItem("biometria_preferida") === "true");
    setIsDark(document.documentElement.dataset.theme !== "light");
    checkBiometricSupport();
    getProfile();
  }, []);

  const toggleTheme = async () => {
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = newTheme;
    document.documentElement.className = newTheme;
    setIsDark(!isDark);
    // Persist to Supabase if possible
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("profiles").update({ theme_preference: newTheme }).eq("id", session.user.id);
    }
  };

  const checkBiometricSupport = async () => {
    if (window.PublicKeyCredential && PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setCanUseBiometrics(available);
    }
  };

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data } = await supabase.from("profiles").select("*, couples(invite_code)").eq("id", session.user.id).single();
      setProfile(data);

      if (data?.couple_id) {
        const { data: members } = await supabase.from("profiles").select("id").eq("couple_id", data.couple_id);
        setCoupleInfo({ invite_code: (data.couples as { invite_code?: string })?.invite_code, member_count: members?.length });
      }
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    if (!confirm("Tem certeza que deseja sair?")) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  const startPinSetup = () => { setSetupStep("create"); setSetupPin(""); setTempPin(""); setShowPinSetup(true); setSetupError(false); };

  const handlePinDigit = (digit: string) => {
    setSetupError(false);
    const cur = setupPin + digit;
    if (cur.length <= 6) {
      setSetupPin(cur);
      if (cur.length === 6) {
        if (setupStep === "create") { setTempPin(cur); setSetupPin(""); setSetupStep("confirm"); }
        else { cur === tempPin ? completePinSetup(cur) : (setSetupError(true), setSetupPin("")); }
      }
    }
  };

  const completePinSetup = async (pin: string) => {
    setStoredPinHash(await hashPin(pin));
    setHasPin(true); setShowPinSetup(false);
  };

  const toggleBiometrics = async () => {
    if (!hasBiometrics) {
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        await navigator.credentials.get({ publicKey: { challenge, userVerification: "required", timeout: 60000 } as PublicKeyCredentialRequestOptions });
        localStorage.setItem("biometria_preferida", "true");
        setHasBiometrics(true);
      } catch { /* ignored */ }
    } else { localStorage.removeItem("biometria_preferida"); setHasBiometrics(false); }
  };

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--border-color)', borderTopColor: '#C850C0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );

  const settingRow = (icon: React.ReactNode, iconBg: string, label: string, sub?: string, right?: React.ReactNode, onClick?: () => void) => (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
      cursor: onClick ? 'pointer' : 'default',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'background 0.15s',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {right || (onClick && <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />)}
    </div>
  );

  const Toggle = ({ active }: { active: boolean }) => (
    <div className={`toggle-track${active ? ' active' : ''}`}>
      <div className="toggle-thumb" />
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100dvh', paddingBottom: 32 }} className="page-animate">
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #1e0a3c 0%, #2d0f5c 60%, #1a0533 100%)',
        padding: '32px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FF6B6B, #C850C0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '3px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(200,80,192,0.35)',
        }}>
          <User size={40} color="white" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>{String(profile?.full_name || "Usuário")}</h1>
          {profile?.created_at && (
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>
              Desde {new Date(profile.created_at as string).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
        {coupleInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 100, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.12)' }}>
            <Users size={14} color="rgba(255,255,255,0.6)" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
              {coupleInfo.member_count === 2 ? '💑 Casal conectado' : '👤 Aguardando parceiro(a)'}
            </span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 430, margin: '0 auto', padding: '0 16px 24px' }}>
        {/* Preferences */}
        <div style={{ marginTop: 20 }}>
          <div className="section-title">Preferências</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {settingRow(
              <Bell size={18} color="#fbbf24" />, 'rgba(251,191,36,0.12)', 'Notificações', 'Alertas de novas transações',
              <Toggle active={true} />
            )}
            {settingRow(
              isDark ? <Moon size={18} color="#a78bfa" /> : <Sun size={18} color="#fbbf24" />,
              isDark ? 'rgba(167,139,250,0.12)' : 'rgba(251,191,36,0.12)',
              isDark ? 'Modo Escuro' : 'Modo Claro', 'Tema da interface',
              <Toggle active={isDark} />, toggleTheme
            )}
          </div>
        </div>

        {/* Security */}
        <div style={{ marginTop: 20 }}>
          <div className="section-title">Conta e Segurança</div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {settingRow(<Shield size={18} color="#38bdf8" />, 'rgba(56,189,248,0.12)', 'Privacidade', 'Configurações de dados')}
            {isPwaActive && settingRow(
              <Lock size={18} color="#a78bfa" />, 'rgba(167,139,250,0.12)',
              'PIN de Acesso', hasPin ? 'PIN ativo — clique para remover' : 'Configurar PIN de 6 dígitos',
              <Toggle active={hasPin} />,
              hasPin ? () => { if (confirm("Remover PIN?")) { clearPin(); setHasPin(false); setHasBiometrics(false); localStorage.removeItem("biometria_preferida"); } } : startPinSetup
            )}
            {isPwaActive && hasPin && canUseBiometrics && settingRow(
              <Fingerprint size={18} color="#34d399" />, 'rgba(52,211,153,0.12)',
              'Biometria', 'Digital ou Face ID',
              <Toggle active={hasBiometrics} />, toggleBiometrics
            )}
          </div>
        </div>

        {/* Logout */}
        <div style={{ marginTop: 24 }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, background: 'rgba(251,113,133,0.08)', border: '1.5px solid rgba(251,113,133,0.2)',
              borderRadius: 16, color: '#fb7185', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <LogOut size={18} />
            Sair da Conta
          </button>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 20, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          CasalFinance v2.0
        </div>
      </div>

      {/* PIN Setup Overlay */}
      <AnimatePresence>
        {showPinSetup && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 32 }}
          >
            <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 40 }}>
                <button onClick={() => setShowPinSetup(false)} style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--text-muted)', cursor: 'pointer' }}>Cancelar</button>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#C850C0' }}>NOVO PIN</span>
                <div style={{ width: 56 }} />
              </div>

              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(200,80,192,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={32} color="#C850C0" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {setupStep === "create" ? "Crie seu PIN" : "Confirme o PIN"}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  {setupStep === "create" ? "6 dígitos numéricos" : "Digite novamente para confirmar"}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: setupError ? '#fb7185' : setupPin.length > i ? '#C850C0' : 'var(--border-color)',
                    border: `2px solid ${setupError ? '#fb7185' : setupPin.length > i ? '#C850C0' : 'var(--border-color)'}`,
                    transition: 'all 0.2s',
                  }} />
                ))}
              </div>
              {setupError && <p style={{ color: '#fb7185', fontSize: 13, marginBottom: 16 }}>PINs não coincidem. Tente novamente.</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, width: '100%', marginTop: 'auto' }}>
                {[1,2,3,4,5,6,7,8,9].map(n => (
                  <button key={n} onClick={() => handlePinDigit(String(n))} style={{
                    height: 64, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)',
                    borderRadius: 16, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}>{n}</button>
                ))}
                <div />
                <button onClick={() => handlePinDigit("0")} style={{ height: 64, background: 'var(--bg-card)', border: '1.5px solid var(--border-color)', borderRadius: 16, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>0</button>
                <button onClick={() => setSetupPin(p => p.slice(0, -1))} style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <Delete size={22} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

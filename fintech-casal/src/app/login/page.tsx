"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useState, useEffect } from "react";
import { Fingerprint, Loader2, Mail, Lock, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isPWA } from "@/lib/pwa";
import { getStoredPinHash } from "@/lib/pin";
import { PinScreen } from "@/components/PinScreen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const [showPinScreen, setShowPinScreen] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const hash = getStoredPinHash();
    setPinHash(hash);
    setIsPwaActive(isPWA());
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("Credenciais inválidas. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
    } catch (error) {
      setError("Erro no login com Google.");
      setIsLoading(false);
    }
  };

  if (showPinScreen && pinHash) {
    return (
      <PinScreen
        storedHash={pinHash}
        onSuccess={() => router.push("/")}
        onFallback={() => setShowPinScreen(false)}
      />
    );
  }

  return (
    <div className="login-container">
      {/* Decorative background orbs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(200,80,192,0.12)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'rgba(65,88,208,0.15)', filter: 'blur(50px)', pointerEvents: 'none' }} />

      <div className="login-card">

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: 'linear-gradient(135deg, #FFFFFF, #DBEAFE)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.10)',
            border: '1px solid rgba(59,130,246,0.08)',
          }}>
            <img src="../icon.png" alt="CasalFinance Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1 className="login-title">CasalFinance</h1>
            <p className="login-subtitle">Finanças a dois, juntos 💑</p>
          </div>
        </div>

        {error && (
          <div style={{ width: '100%', padding: '12px 16px', background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.25)', borderRadius: 14, fontSize: 13, color: '#fb7185', fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Email/Password form */}
        <form onSubmit={handleEmailLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Mail size={20} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="email" placeholder="E-mail" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="login-input"
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={20} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }} />
            <input
              type="password" placeholder="Senha" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="login-input"
            />
          </div>
          <button type="submit" disabled={isLoading} className="login-btn-submit">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ou</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border-color)' }} />
        </div>

        {/* Social + PIN actions */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleGoogleLogin} type="button" disabled={isLoading}
            className="login-btn-google"
          >
            <svg viewBox="0 0 24 24" width={20} height={20}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar com Google
          </button>

          {isPwaActive && pinHash && (
            <button onClick={() => setShowPinScreen(true)} type="button" disabled={isLoading} className="login-btn-pin">
              <Key size={18} />
              Entrar com PIN
            </button>
          )}
        </div>

        <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          Ainda não tem conta?{' '}
          <Link href="/signup" style={{ color: '#7C6FF7', fontWeight: 700, textDecoration: 'none' }}>Cadastre-se</Link>
        </p>

      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 24px;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px 36px;
          box-shadow: 0 8px 40px rgba(120,80,200,0.12);
          border: 1px solid rgba(255,255,255,0.6);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 28px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
        }
        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: #1F1235;
          margin: 0;
          letter-spacing: -0.3px;
        }
        .login-subtitle {
          font-size: 14px;
          color: #6B7280;
          margin: 4px 0 0;
        }
        .login-input {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          border: 1px solid #E5E7EB;
          padding-left: 44px;
          padding-right: 16px;
          font-size: 15px;
          outline: none;
          background: white;
          color: #1F1235;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .login-input:focus {
          border-color: #7C6FF7;
          box-shadow: 0 0 0 3px rgba(124,111,247,0.15);
        }
        .login-input::placeholder {
          color: #9CA3AF;
        }
        .login-btn-submit {
          width: 100%;
          height: 48px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--brand-gradient);
          color: white;
          border: none;
          box-shadow: var(--shadow-cta);
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-btn-submit:hover {
          opacity: 0.92;
          transform:-translateY(-1px);
        }
        .login-btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .login-btn-google {
          width: 100%;
          height: 48px;
          border: 1.5px solid #E5E7EB;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
          color: #1F1235;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .login-btn-google:hover:not(:disabled) {
          background: #F9FAFB;
        }
        .login-btn-google:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-btn-pin {
          width: 100%;
          height: 48px;
          border: 1.5px solid rgba(167,139,250,0.2);
          border-radius: 12px;
          background: rgba(167,139,250,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-weight: 600;
          font-size: 14px;
          color: #a78bfa;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }
        .login-btn-pin:hover:not(:disabled) {
          background: rgba(167,139,250,0.15);
        }
        .login-btn-pin:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Dark Mode */
        .dark .login-card,
        [data-theme="dark"] .login-card {
          background: rgba(26,26,46,0.85);
          border-color: rgba(255,255,255,0.1);
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
        }
        .dark .login-title,
        [data-theme="dark"] .login-title {
          color: #E8E8F0;
        }
        .dark .login-input,
        [data-theme="dark"] .login-input {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #E8E8F0;
        }
        .dark .login-input:focus,
        [data-theme="dark"] .login-input:focus {
          border-color: #7C6FF7;
          box-shadow: 0 0 0 3px rgba(124,111,247,0.25);
        }
        .dark .login-btn-google,
        [data-theme="dark"] .login-btn-google {
          background: #1E1B3A;
          border-color: rgba(255,255,255,0.1);
          color: #E8E8F0;
        }
        .dark .login-btn-google:hover:not(:disabled),
        [data-theme="dark"] .login-btn-google:hover:not(:disabled) {
          background: #2a264f;
        }
      `}</style>
    </div>
  );
}

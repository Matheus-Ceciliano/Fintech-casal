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
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        
        {/* Logo / Title */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 overflow-hidden border border-zinc-800">
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinCasal</h1>
          <p className="text-sm text-zinc-400 text-center">
            Acesso Seguro
          </p>
        </div>

        {error && <div className="text-red-400 text-sm">{error}</div>}

        {/* Formulário de Email/Senha */}
        <form onSubmit={handleEmailLogin} className="w-full space-y-4 pt-4">
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
              <input
                type="email"
                placeholder="E-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-zinc-500" size={18} />
              <input
                type="password"
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-indigo-600 text-white py-3.5 rounded-xl font-medium transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Entrar"}
          </button>
        </form>

        <div className="relative flex items-center w-full">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-zinc-500 uppercase">Ou</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>

        {/* Actions */}
        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleLogin}
            type="button"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-white text-zinc-900 py-3.5 rounded-xl font-medium transition-all hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-70"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>Continuar com Google</span>
          </button>

          {isPwaActive && pinHash && (
            <button
              onClick={() => setShowPinScreen(true)}
              type="button"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-indigo-600/10 text-indigo-400 py-3.5 rounded-xl font-medium border border-indigo-500/20 transition-all hover:bg-indigo-600/20 active:scale-[0.98] disabled:opacity-70"
            >
              <Key size={20} />
              <span>Entrar com PIN</span>
            </button>
          )}
        </div>

        <p className="text-zinc-500 text-sm mt-4">
          Ainda não tem conta? <Link href="/signup" className="text-indigo-400 font-medium hover:underline">Cadastre-se</Link>
        </p>

      </div>
    </div>
  );
}

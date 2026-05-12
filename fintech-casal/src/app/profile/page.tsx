"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, Bell, Moon, ChevronRight, Lock, Delete, Fingerprint } from "lucide-react";
import { isPWA } from "@/lib/pwa";
import { hashPin, getStoredPinHash, setStoredPinHash, clearPin } from "@/lib/pin";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPwaActive, setIsPwaActive] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [canUseBiometrics, setCanUseBiometrics] = useState(false);
  
  // PIN Setup State
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
    checkBiometricSupport();
    getProfile();
  }, []);

  const checkBiometricSupport = async () => {
    if (window.PublicKeyCredential && 
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setCanUseBiometrics(available);
    }
  };

  async function getProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const startPinSetup = () => {
    setSetupStep("create");
    setSetupPin("");
    setTempPin("");
    setShowPinSetup(true);
    setSetupError(false);
  };

  const handlePinDigit = (digit: string) => {
    setSetupError(false);
    const currentPin = setupPin + digit;
    if (currentPin.length <= 6) {
      setSetupPin(currentPin);
      if (currentPin.length === 6) {
        if (setupStep === "create") {
          setTempPin(currentPin);
          setSetupPin("");
          setSetupStep("confirm");
        } else {
          if (currentPin === tempPin) {
            completePinSetup(currentPin);
          } else {
            setSetupError(true);
            setSetupPin("");
          }
        }
      }
    }
  };

  const completePinSetup = async (pin: string) => {
    const hash = await hashPin(pin);
    setStoredPinHash(hash);
    setHasPin(true);
    setShowPinSetup(false);
    alert("PIN configurado com sucesso!");
  };

  const handleRemovePin = () => {
    if (confirm("Deseja realmente remover o PIN de acesso rápido?")) {
      clearPin();
      setHasPin(false);
      setHasBiometrics(false);
      localStorage.removeItem("biometria_preferida");
    }
  };

  const toggleBiometrics = async () => {
    if (!hasBiometrics) {
      // Ativar
      try {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        // Solicita biometria uma vez para confirmar
        await navigator.credentials.get({
          publicKey: {
            challenge,
            userVerification: "required",
            // @ts-ignore
            authenticatorAttachment: "platform",
            timeout: 60000,
          }
        });

        localStorage.setItem("biometria_preferida", "true");
        setHasBiometrics(true);
        alert("Biometria ativada com sucesso!");
      } catch (e) {
        console.error("Falha ao ativar biometria:", e);
      }
    } else {
      // Desativar
      localStorage.removeItem("biometria_preferida");
      setHasBiometrics(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-24">
      {/* Header */}
      <div className="p-6 pt-12 flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/20 border-4 border-zinc-900">
          <User size={48} className="text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{profile?.full_name || "Usuário"}</h1>
          <p className="text-zinc-500 text-sm">Membro desde {new Date(profile?.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-8">
        {/* Account Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Conta e Segurança</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Shield size={20} />
                </div>
                <span>Privacidade</span>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </div>

            {isPwaActive && (
              <>
                <div 
                  onClick={hasPin ? handleRemovePin : startPinSetup}
                  className="p-4 flex items-center justify-between border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                      <Lock size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span>PIN de Acesso Rápido</span>
                      <span className="text-[10px] text-zinc-500">{hasPin ? "PIN Ativo (Clique para remover)" : "Configurar PIN de 6 dígitos"}</span>
                    </div>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${hasPin ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${hasPin ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </div>

                {hasPin && canUseBiometrics && (
                  <div 
                    onClick={toggleBiometrics}
                    className="p-4 flex items-center justify-between border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                        <Fingerprint size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span>Desbloqueio por Biometria</span>
                        <span className="text-[10px] text-zinc-500">Usar digital ou Face ID</span>
                      </div>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${hasBiometrics ? 'bg-emerald-600' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${hasBiometrics ? 'left-6' : 'left-1'}`}></div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg">
                  <Bell size={20} />
                </div>
                <span>Notificações</span>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-2">Preferências</h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-800 text-zinc-400 rounded-lg">
                  <Moon size={20} />
                </div>
                <span>Modo Escuro</span>
              </div>
              <div className="w-10 h-5 bg-indigo-600 rounded-full relative">
                <div className="absolute top-1 left-6 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 font-medium hover:bg-rose-500/20 transition-all active:scale-[0.98]"
        >
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </button>

        <div className="text-center text-[10px] text-zinc-600 uppercase tracking-[0.2em] pt-4">
          FinCasal v1.0.0
        </div>
      </div>

      {/* PIN Setup Overlay */}
      <AnimatePresence>
        {showPinSetup && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[300] bg-zinc-950 flex flex-col items-center p-8"
          >
            <div className="w-full max-w-md flex flex-col items-center h-full">
              <div className="flex justify-between w-full mb-12">
                <button onClick={() => setShowPinSetup(false)} className="text-zinc-400 hover:text-white">Cancelar</button>
                <div className="text-indigo-400 font-bold uppercase tracking-tighter">Novo PIN</div>
                <div className="w-12"></div>
              </div>

              <div className="flex flex-col items-center space-y-4 mb-12">
                <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                  <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold">
                  {setupStep === "create" ? "Crie seu PIN de 6 dígitos" : "Confirme seu PIN"}
                </h2>
                <p className="text-zinc-500 text-center text-sm">
                  {setupStep === "create" 
                    ? "Escolha uma combinação numérica para acessar o app rapidamente." 
                    : "Digite novamente para confirmar o PIN."}
                </p>
              </div>

              {/* Indicators */}
              <div className="flex space-x-4 mb-12">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full border border-zinc-800 transition-colors ${
                      setupPin.length > i ? "bg-indigo-600 border-indigo-600" : "bg-transparent"
                    } ${setupError ? "bg-rose-500 border-rose-500" : ""}`}
                  />
                ))}
              </div>

              {setupError && (
                <p className="text-rose-500 text-sm mb-6 animate-pulse">Os PINs não coincidem. Tente novamente.</p>
              )}

              {/* Pad */}
              <div className="w-full grid grid-cols-3 gap-4 mt-auto max-w-xs mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinDigit(num.toString())}
                    className="h-16 bg-zinc-900 border border-zinc-800 text-xl font-bold rounded-2xl active:bg-indigo-600 transition-colors"
                  >
                    {num}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handlePinDigit("0")}
                  className="h-16 bg-zinc-900 border border-zinc-800 text-xl font-bold rounded-2xl active:bg-indigo-600 transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => setSetupPin(prev => prev.slice(0, -1))}
                  className="h-16 flex items-center justify-center text-zinc-500 active:text-white"
                >
                  <Delete size={24} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

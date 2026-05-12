"use client";

import { useState, useEffect } from "react";
import { Fingerprint, Lock } from "lucide-react";

import { isPWA } from "@/lib/pwa";

export function AppLockProvider({
  children,
  requireLock,
}: {
  children: React.ReactNode;
  requireLock: boolean;
}) {
  const [isLocked, setIsLocked] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    // Só bloqueia se requireLock for true E for PWA
    if (requireLock && isPWA()) {
      setIsLocked(true);
    }
  }, [requireLock]);

  useEffect(() => {
    // Se o usuário ativar o bloqueio, tentamos autenticar assim que carregar
    if (isLocked) {
      handleBiometricUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked]);

  const handleBiometricUnlock = async () => {
    setAuthFailed(false);
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Biometria não suportada neste dispositivo.");
      }

      // Desafio fictício local para forçar o prompt do SO (FaceID/TouchID/PIN)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Chamada da API Nativa do WebAuthn
      // Isso irá acionar a interface de autenticação do sistema operacional
      await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: "required",
          timeout: 60000,
        },
      });

      // Se a promise não der throw, o usuário se autenticou com sucesso no SO
      setIsLocked(false);
    } catch (error) {
      console.error("Falha na biometria:", error);
      setAuthFailed(true);
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
        <div className="flex flex-col items-center space-y-8 max-w-sm w-full">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <Lock className="text-white" size={40} />
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">App Bloqueado</h1>
            <p className="text-sm text-zinc-400">
              Autentique-se para visualizar suas finanças.
            </p>
          </div>

          {authFailed && (
            <p className="text-red-400 text-sm text-center">
              Biometria não reconhecida ou cancelada.
            </p>
          )}

          <button
            onClick={handleBiometricUnlock}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 py-4 rounded-xl font-medium transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            <Fingerprint size={20} />
            <span>Desbloquear com Biometria</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

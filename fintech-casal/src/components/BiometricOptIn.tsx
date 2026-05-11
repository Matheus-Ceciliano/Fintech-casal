"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Fingerprint, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BiometricOptIn({ userId }: { userId: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Só mostramos se não houver um "declined" no local storage e se suportado
    const hasDeclined = localStorage.getItem("declined_biometrics");
    if (!hasDeclined && window.PublicKeyCredential) {
      // Dá um pequeno atraso para a tela principal carregar antes do modal aparecer
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDecline = () => {
    localStorage.setItem("declined_biometrics", "true");
    setIsVisible(false);
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      if (!window.PublicKeyCredential) throw new Error("Biometria não suportada.");

      // Cria a credencial local via WebAuthn (Cerimônia de Registro)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBytes = new Uint8Array(16);
      window.crypto.getRandomValues(userIdBytes);

      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Fintech Casal", id: window.location.hostname },
          user: { id: userIdBytes, name: userId, displayName: "Usuário FinCasal" },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      });

      // Se a promise passar, significa que a credencial foi criada localmente!
      // Atualizamos o banco
      const { error } = await supabase
        .from("profiles")
        .update({ has_biometrics: true })
        .eq("id", userId);

      if (error) throw error;

      setIsVisible(false);
      router.refresh();
    } catch (err) {
      console.error("Erro ao ativar biometria", err);
      // Podemos fechar ou mostrar erro
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl w-full max-w-sm space-y-6 relative shadow-2xl">
        <button
          onClick={handleDecline}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center">
            <Fingerprint size={32} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Ativar Acesso Rápido?</h2>
          <p className="text-sm text-zinc-400">
            Deseja usar sua biometria (FaceID/Digital) para desbloquear o app mais rapidamente nas próximas vezes?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 py-3.5 rounded-xl text-white font-medium transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Sim, Ativar Biometria"}
          </button>
          <button
            onClick={handleDecline}
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl text-zinc-400 font-medium transition-all hover:text-white hover:bg-zinc-800"
          >
            Agora Não
          </button>
        </div>
      </div>
    </div>
  );
}

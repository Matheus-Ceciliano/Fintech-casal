"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Fingerprint, Shield, Bell, Moon, ChevronRight } from "lucide-react";
import { isPWA } from "@/lib/pwa";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPwaActive, setIsPwaActive] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    setIsPwaActive(isPWA());
    getProfile();
  }, []);

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

  const handleRegisterBiometrics = async () => {
    setLoading(true);
    try {
      if (!window.PublicKeyCredential) {
        throw new Error("Seu navegador não suporta biometria.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado.");

      // 1. Gerar Desafio (Challenge)
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userHandle = new Uint8Array(16);
      window.crypto.getRandomValues(userHandle);

      // 2. Criar Credencial
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "FinCasal", id: window.location.hostname },
          user: {
            id: userHandle,
            name: session.user.email || "usuario",
            displayName: profile?.full_name || "Usuário",
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },   // ES256
            { type: "public-key", alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          attestation: "none",
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (!credential) throw new Error("Falha ao criar credencial.");

      // 3. Converter para salvar no Supabase (Base64 seguro para grandes arrays)
      const bufferToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };

      const credentialId = bufferToBase64(credential.rawId);
      const response = credential.response as any;
      const publicKey = response.getPublicKey ? bufferToBase64(response.getPublicKey()) : "";

      // 4. Salvar no Supabase
      const { error: dbError } = await supabase
        .from("passkey_credentials")
        .insert({
          user_id: session.user.id,
          credential_id: credentialId,
          public_key: publicKey,
          counter: 0,
        });

      if (dbError) throw dbError;

      // 5. Atualizar perfil e localStorage
      await supabase
        .from("profiles")
        .update({ has_biometrics: true })
        .eq("id", session.user.id);

      localStorage.setItem("biometria_ativa", "true");
      setProfile({ ...profile, has_biometrics: true });
      alert("Biometria cadastrada com sucesso!");
    } catch (error: any) {
      console.error("Erro no registro:", error);
      if (error.name === "NotAllowedError") {
        alert("Operação cancelada pelo usuário.");
      } else {
        alert(error.message || "Erro ao cadastrar biometria.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
              <div 
                onClick={handleRegisterBiometrics}
                className="p-4 flex items-center justify-between border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Fingerprint size={20} />
                  </div>
                  <div className="flex flex-col">
                    <span>Ativar Biometria</span>
                    <span className="text-[10px] text-zinc-500">Apenas disponível no PWA</span>
                  </div>
                </div>
                <div className={`w-10 h-5 rounded-full relative transition-colors ${profile?.has_biometrics ? 'bg-indigo-600' : 'bg-zinc-700'}`}>
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${profile?.has_biometrics ? 'left-6' : 'left-1'}`}></div>
                </div>
              </div>
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
    </div>
  );
}

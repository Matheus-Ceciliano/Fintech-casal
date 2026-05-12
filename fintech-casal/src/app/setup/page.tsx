"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Users, Link as LinkIcon, Loader2 } from "lucide-react";

export default function SetupPage() {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClientComponentClient();

  const generateInviteCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateCouple = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não logado");

      const code = generateInviteCode();

      // 1. Cria o casal com o código gerado
      const { data: coupleData, error: coupleError } = await supabase
        .from("couples")
        .insert({ name: "Nosso Perfil", invite_code: code })
        .select()
        .single();

      if (coupleError) throw coupleError;

      // 2. Vincula o usuário ao grupo (usa upsert para caso o perfil tenha sido apagado mas o auth continue)
      const { error: profileError, data: updatedProfiles } = await supabase
        .from("profiles")
        .upsert({ 
          id: userData.user.id,
          couple_id: coupleData.id,
          full_name: userData.user.user_metadata?.full_name || ""
        })
        .select();

      if (profileError) throw profileError;
      
      if (!updatedProfiles || updatedProfiles.length === 0) {
        throw new Error("O grupo foi criado, mas o banco de dados impediu de vincular ao seu perfil (falha silenciosa de RLS ou perfil inexistente).");
      }

      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao criar grupo.");
      setIsLoading(false);
    }
  };

  const handleJoinCouple = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.length !== 6) {
      setError("O código deve ter 6 caracteres.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não logado");

      // 1. Busca o casal pelo código de convite
      const { data: coupleData, error: coupleError } = await supabase
        .from("couples")
        .select("id")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (coupleError || !coupleData) throw new Error("Código inválido ou não encontrado.");

      // 2. Vincula o usuário ao grupo
      const { error: profileError, data: updatedProfiles } = await supabase
        .from("profiles")
        .upsert({ 
          id: userData.user.id,
          couple_id: coupleData.id,
          full_name: userData.user.user_metadata?.full_name || ""
        })
        .select();

      if (profileError) throw profileError;
      
      if (!updatedProfiles || updatedProfiles.length === 0) {
        throw new Error("Falha ao entrar no grupo: a linha do seu perfil não foi atualizada.");
      }

      window.location.href = "/";
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao entrar no grupo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
      <div className="w-full max-w-sm space-y-8">
        
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Configure sua Conta</h1>
          <p className="text-sm text-zinc-400">
            Você precisa criar ou entrar em um grupo de casal para continuar.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Opção 1: Criar */}
          <button
            onClick={handleCreateCouple}
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3.5 rounded-xl font-medium transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Users size={20} />}
            <span>Criar Novo Grupo</span>
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">Ou</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          {/* Opção 2: Entrar com Código */}
          <form onSubmit={handleJoinCouple} className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="code" className="text-sm font-medium text-zinc-400">
                Tem um convite?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon size={18} className="text-zinc-500" />
                </div>
                <input
                  id="code"
                  type="text"
                  maxLength={6}
                  placeholder="Código de 6 dígitos"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent uppercase placeholder:normal-case transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || inviteCode.length !== 6}
              className="w-full flex items-center justify-center space-x-2 bg-zinc-800 text-zinc-300 py-3.5 rounded-xl font-medium transition-all hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <span>Entrar no Grupo</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

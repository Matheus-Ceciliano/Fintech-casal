"use client";

import { useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        // Tratamento amigável para regras de complexidade de senha do Supabase
        if (signUpError.message.includes("Password should contain")) {
          throw new Error("A senha escolhida é muito fraca. Tente misturar letras maiúsculas, minúsculas e números.");
        }
        throw signUpError;
      }
      
      // Passa para a tela de OTP
      setIsOtpMode(true);
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next
    if (value !== "" && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;

    setIsLoading(true);
    setError("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (verifyError) throw verifyError;

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-hidden relative">
      {/* Voltar */}
      {!isOtpMode && (
        <div className="absolute top-6 left-6">
          <Link href="/login" className="flex items-center text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Voltar
          </Link>
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col items-center space-y-8">
        {!isOtpMode ? (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Criar Conta</h1>
              <p className="text-sm text-zinc-400">Proteja suas finanças em casal.</p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <form onSubmit={handleSignup} className="w-full space-y-4">
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
                    placeholder="Senha forte"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                  <input
                    type="password"
                    placeholder="Confirme a senha"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center bg-indigo-600 text-white py-3.5 rounded-xl font-medium transition-all hover:bg-indigo-500 active:scale-[0.98] mt-4"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Criar Conta Segura"}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">Verifique seu E-mail</h1>
              <p className="text-sm text-zinc-400">
                Enviamos um código de 6 dígitos para <br /> <span className="text-white font-medium">{email}</span>
              </p>
            </div>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <div className="flex justify-between w-full max-w-[280px] gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-zinc-900 border border-zinc-700 text-white rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              ))}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full flex items-center justify-center bg-indigo-600 text-white py-3.5 rounded-xl font-medium transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Confirmar Acesso"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

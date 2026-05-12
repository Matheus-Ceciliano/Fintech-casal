"use client";

import { useState, useEffect } from "react";
import { Delete, Lock, UserKey, Loader2, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hashPin } from "@/lib/pin";

interface PinScreenProps {
  onSuccess: () => void;
  onFallback: () => void;
  storedHash: string;
  maxAttempts?: number;
}

export function PinScreen({ onSuccess, onFallback, storedHash, maxAttempts = 3 }: PinScreenProps) {
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    if (window.PublicKeyCredential && 
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      const preferred = localStorage.getItem("biometria_preferida") === "true";
      setIsBiometricsAvailable(available && preferred);
      
      // Auto-trigger biometrics if preferred
      if (available && preferred) {
        handleNativeBiometrics();
      }
    }
  };

  const handleNativeBiometrics = async () => {
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: "required",
          // @ts-ignore
          authenticatorAttachment: "platform",
          timeout: 60000,
        },
      });

      onSuccess();
    } catch (error) {
      console.error("Biometria recusada ou falhou:", error);
      // Silently fail and allow PIN input
    }
  };

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setIsError(false);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setIsError(false);
  };

  useEffect(() => {
    if (pin.length === 6) {
      validatePin();
    }
  }, [pin]);

  const validatePin = async () => {
    setIsLoading(true);
    const enteredHash = await hashPin(pin);
    
    if (enteredHash === storedHash) {
      onSuccess();
    } else {
      setIsError(true);
      setPin("");
      setAttempts((prev) => prev + 1);
      
      if (attempts + 1 >= maxAttempts) {
        onFallback();
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-between p-8 pb-12 overflow-hidden">
      {/* Header */}
      <div className="mt-12 flex flex-col items-center space-y-6">
        <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 overflow-hidden border border-zinc-800">
          <img src="/icons/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold text-white">Digite seu PIN</h1>
          <p className="text-sm text-zinc-500">Acesso rápido ao FinCasal</p>
        </div>

        {/* PIN Indicators */}
        <div className="flex space-x-4 pt-4">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={false}
              animate={{
                scale: pin.length > i ? 1.2 : 1,
                backgroundColor: isError ? "#f43f5e" : (pin.length > i ? "#4f46e5" : "#27272a")
              }}
              className="w-4 h-4 rounded-full border border-zinc-800"
            />
          ))}
        </div>
        
        <AnimatePresence>
          {isError && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-rose-500 text-xs font-medium"
            >
              PIN incorreto. Tentativas: {attempts}/{maxAttempts}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Number Pad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num.toString())}
            className="h-20 bg-zinc-900/50 hover:bg-zinc-800 text-2xl font-semibold rounded-2xl border border-zinc-800/50 transition-all active:scale-90 flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <div className="flex items-center justify-center">
          {isBiometricsAvailable && (
            <button
              onClick={handleNativeBiometrics}
              className="w-16 h-16 bg-indigo-600/10 text-indigo-400 rounded-full flex items-center justify-center transition-all active:scale-90"
            >
              <Fingerprint size={28} />
            </button>
          )}
        </div>
        <button
          onClick={() => handleNumberClick("0")}
          className="h-20 bg-zinc-900/50 hover:bg-zinc-800 text-2xl font-semibold rounded-2xl border border-zinc-800/50 transition-all active:scale-90 flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-20 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 rounded-2xl border border-zinc-800/50 transition-all active:scale-90 flex items-center justify-center"
        >
          <Delete size={24} />
        </button>
      </div>

      {/* Footer Fallback */}
      <button
        onClick={onFallback}
        className="flex items-center space-x-2 text-zinc-500 hover:text-white transition-colors"
      >
        <UserKey size={18} />
        <span className="text-sm font-medium">Usar senha da conta</span>
      </button>

      {isLoading && (
        <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[1px] flex items-center justify-center">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      )}
    </div>
  );
}

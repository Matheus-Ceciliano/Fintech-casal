"use client";

import { useState, useEffect } from "react";
import { isPWA } from "@/lib/pwa";
import { PinScreen } from "./PinScreen";
import { getStoredPinHash } from "@/lib/pin";
import { useRouter } from "next/navigation";

export function AppLockProvider({
  children,
  requireLock,
}: {
  children: React.ReactNode;
  requireLock: boolean;
}) {
  const [isLocked, setIsLocked] = useState(false);
  const [pinHash, setPinHash] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Só ativa o bloqueio se for PWA e tiver PIN configurado
    if (isPWA()) {
      const storedHash = getStoredPinHash();
      if (storedHash) {
        setPinHash(storedHash);
        setIsLocked(true);
      }
    }
  }, [requireLock]);

  const handleUnlockSuccess = () => {
    setIsLocked(false);
  };

  const handleFallback = () => {
    // Se falhar o PIN ou o usuário escolher senha, redireciona para login
    setIsLocked(false);
    router.push("/login");
  };

  if (isLocked && pinHash) {
    return (
      <PinScreen 
        storedHash={pinHash} 
        onSuccess={handleUnlockSuccess}
        onFallback={handleFallback}
      />
    );
  }

  return <>{children}</>;
}

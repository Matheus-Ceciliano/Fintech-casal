/**
 * Utilitário para gerenciamento de PIN (Opção B)
 */

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getStoredPinHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("app_pin_hash");
}

export function setStoredPinHash(hash: string): void {
  localStorage.setItem("app_pin_hash", hash);
}

export function clearPin(): void {
  localStorage.removeItem("app_pin_hash");
}

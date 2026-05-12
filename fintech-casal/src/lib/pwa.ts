export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches;

  // @ts-ignore
  const isIOSStandalone = window.navigator.standalone === true;

  return isStandalone || isIOSStandalone;
}

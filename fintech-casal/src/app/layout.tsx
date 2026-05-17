import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { AppLockProvider } from "@/components/AppLockProvider";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CasalFinance — Finanças a Dois",
  description: "Gerencie as finanças do casal de forma simples, bonita e inteligente.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CasalFinance",
  },
  openGraph: {
    title: "CasalFinance",
    description: "Finanças compartilhadas para casais",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F7FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  // @ts-expect-error - auth-helpers expects a sync return but next 15+ types it as async
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data: { session } } = await supabase.auth.getSession();

  let hasBiometrics = false;
  let theme = "light";
  let shouldShowNavigation = false;
  if (session) {
    const { data } = await supabase
      .from("profiles")
      .select("has_biometrics, theme_preference, couple_id")
      .eq("id", session.user.id)
      .single();
    hasBiometrics = data?.has_biometrics || false;
    theme = data?.theme_preference || "light";
    shouldShowNavigation = Boolean(data?.couple_id);
  }

  return (
    <html lang="pt-BR" data-theme={theme} className={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={shouldShowNavigation ? "has-sidebar" : ""}>
        <AppLockProvider requireLock={hasBiometrics}>
          {/* Desktop sidebar — hidden on mobile via CSS */}
          {shouldShowNavigation && (
            <div className="sidebar-wrapper">
              <Sidebar />
            </div>
          )}

          <main style={{ minHeight: "100dvh" }}>
            {children}
          </main>

          {/* Mobile bottom nav — hidden on desktop via CSS */}
          {shouldShowNavigation && <BottomNav />}

          <Toaster
            position="top-center"
            richColors
            expand={false}
            duration={3500}
            toastOptions={{
              style: {
                borderRadius: "14px",
                fontFamily: "inherit",
                fontSize: "14px",
              },
            }}
          />
        </AppLockProvider>
      </body>
    </html>
  );
}

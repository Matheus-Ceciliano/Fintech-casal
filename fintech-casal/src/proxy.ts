import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Ignora arquivos estáticos
  const isStaticAsset = req.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|json|js)$/i);
  if (isStaticAsset) return res;

  // Rotas públicas que não precisam de autenticação
  const isPublicRoute = 
    req.nextUrl.pathname.startsWith("/login") || 
    req.nextUrl.pathname.startsWith("/signup") || 
    req.nextUrl.pathname.startsWith("/auth/callback");

  if (!session && !isPublicRoute) {
    // Redireciona para login se não tiver sessão e não for rota pública
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  if (session && req.nextUrl.pathname === "/login") {
    // Redireciona para a home se estiver logado e tentar acessar o login
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, manifest.json, logo.png, icon-*.png, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|logo\\.png|icon\\.png|apple-icon\\.png|sw\\.js|workbox-.*|icon-.*\\.png|.*\\.svg).*)",
  ],
};

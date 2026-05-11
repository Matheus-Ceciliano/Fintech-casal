"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowRightLeft, Target, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/transactions", label: "Transações", icon: ArrowRightLeft },
    { href: "/metas", label: "Cofrinho", icon: Target },
    { href: "/profile", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(`${href}/`);
          // Special case for Home to not highlight on every route
          const isHome = href === "/";
          const actuallyActive = isHome ? pathname === "/" : isActive;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                actuallyActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              <Icon size={24} strokeWidth={actuallyActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

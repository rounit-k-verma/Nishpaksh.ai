"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BackendStatusBanner } from "@/components/BackendStatusBanner";

const links = [
  { href: "/", label: "Landing" },
  { href: "/upload", label: "CSV Upload" },
  { href: "/dashboard", label: "Analytics" },
  { href: "/report", label: "Bias Report" },
  { href: "/simulator", label: "What-If" },
  { href: "/recommendations", label: "Recommendations" }
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight text-brand-700">
            Nishpaksh AI
          </Link>
          <BackendStatusBanner />
        </div>
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

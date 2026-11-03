"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import TemaToggle from "./TemaToggle";

const MENU = [
  { href: "/", label: "Beranda" },
  { href: "/klaster", label: "Klaster & Ringkasan" },
  { href: "/rute", label: "Rute Evakuasi" },
  { href: "/klasifikasi", label: "Klasifikasi" },
  { href: "/tentang", label: "Tentang" },
];

export default function Navbar() {
  const path = usePathname();
  const [terbuka, setTerbuka] = useState(false);

  const aktif = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5">
      <nav className="navbar kartu mx-auto min-h-0 max-w-7xl !rounded-full px-2 py-1.5 backdrop-blur sm:px-3" aria-label="Navigasi utama">
        <div className="navbar-start gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-10 place-items-center rounded-full bg-neutral text-neutral-content">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" strokeLinecap="round" />
                <path d="M3 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" strokeLinecap="round" />
                <path d="M12 3v7m0 0 3-3m-3 3L9 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm">Banjir Ciledug</span>
              <span className="block text-xs font-normal text-base-content/60">Dashboard</span>
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal gap-1 px-1">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  aria-current={aktif(m.href) ? "page" : undefined}
                  className={`rounded-full ${aktif(m.href) ? "menu-active font-medium" : ""}`}
                  onClick={() => setTerbuka(false)}
                >
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-end gap-1">
          <TemaToggle />
          <button
            type="button"
            className="btn btn-ghost btn-square lg:hidden"
            aria-expanded={terbuka}
            aria-controls="menu-hp"
            aria-label={terbuka ? "Tutup menu" : "Buka menu"}
            onClick={() => setTerbuka((v) => !v)}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              {terbuka ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {terbuka && (
        <div id="menu-hp" className="kartu mx-auto mt-2 max-w-7xl lg:hidden">
          <ul className="menu menu-lg w-full px-2 py-2">
            {MENU.map((m) => (
              <li key={m.href}>
                <Link
                  href={m.href}
                  aria-current={aktif(m.href) ? "page" : undefined}
                  className={`rounded-full ${aktif(m.href) ? "menu-active font-medium" : ""}`}
                  onClick={() => setTerbuka(false)}
                >
                  {m.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}

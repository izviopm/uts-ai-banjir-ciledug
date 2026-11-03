"use client";

import { useEffect, useState } from "react";

export default function TemaToggle() {
  const [gelap, setGelap] = useState(false);

  useEffect(() => {
    // Sinkronisasi awal dengan atribut tema yang dipasang skrip anti-flash di <head>.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGelap(document.documentElement.getAttribute("data-theme") === "banjir-gelap");
  }, []);

  function ganti() {
    const baru = gelap ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", baru === "dark" ? "banjir-gelap" : "banjir");
    try {
      localStorage.setItem("tema", baru);
    } catch {
      /* localStorage bisa diblokir */
    }
    setGelap(!gelap);
  }

  return (
    <button
      type="button"
      className="btn btn-ghost btn-square"
      onClick={ganti}
      aria-label={gelap ? "Aktifkan tema terang" : "Aktifkan tema gelap"}
      title={gelap ? "Tema terang" : "Tema gelap"}
    >
      {gelap ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

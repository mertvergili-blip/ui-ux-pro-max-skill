"use client";

import { useState } from "react";

function ExitIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[14px] w-[14px]" fill="none">
      <path
        d="M7.5 3.5H4.5A1.5 1.5 0 0 0 3 5v10a1.5 1.5 0 0 0 1.5 1.5h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 13.5 16 10l-3.5-3.5M16 10H7.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    setBusy(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      // Full reload, not a client-side route change — clears any
      // in-memory store state along with the session cookie.
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={logout}
      disabled={busy}
      aria-label="Çıkış yap"
      title="Çıkış yap"
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-muted transition-colors hover:border-white/20 hover:text-rose disabled:opacity-40"
    >
      <ExitIcon />
    </button>
  );
}

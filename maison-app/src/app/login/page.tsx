"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Şifre yanlış");
        setLoading(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError("Bağlantı hatası — tekrar dene.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-[340px]"
      >
        <p className="mb-3 text-[10px] uppercase tracking-[3px] text-gold">Maison</p>
        <h1 className="mb-8 font-heading text-2xl text-bone">Girmek için şifre gir.</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          placeholder="Şifre"
          className="w-full border-b border-line bg-transparent pb-2.5 text-sm text-bone outline-none placeholder:text-muted focus:border-gold/50"
        />
        {error && <p className="mt-3 text-[12px] text-rose">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-8 rounded-full bg-gold px-5 py-2.5 text-[11px] uppercase tracking-[1.5px] text-ink transition-opacity disabled:opacity-40"
        >
          {loading ? "Kontrol ediliyor…" : "Gir"}
        </button>
      </motion.form>
    </div>
  );
}

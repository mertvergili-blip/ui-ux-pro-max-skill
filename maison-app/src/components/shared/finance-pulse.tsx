"use client";

import { useState, useEffect } from "react";

interface CoinData {
  usd: number;
  usd_24h_change: number;
}

interface PriceMap {
  bitcoin?: CoinData;
  ethereum?: CoinData;
  solana?: CoinData;
}

const COINS = [
  { id: "bitcoin", sym: "BTC" },
  { id: "ethereum", sym: "ETH" },
  { id: "solana", sym: "SOL" },
] as const;

type Status = "loading" | "live" | "unavailable";

export function FinancePulse() {
  const [prices, setPrices] = useState<PriceMap>({});
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/finance");
        if (!res.ok) throw new Error("finance route failed");
        const data = await res.json();
        if (!cancelled && data.prices) {
          setPrices(data.prices);
          setStatus("live");
        }
      } catch {
        // Keep whatever we last had; only mark unavailable if we never
        // got anything — a stuck "···" was the old failure mode.
        if (!cancelled) {
          setStatus((s) => (s === "live" ? s : "unavailable"));
        }
      }
    };

    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  return (
    <div>
      <div className="flex flex-col gap-1.5">
        {COINS.map(({ id, sym }) => {
          const d = prices[id as keyof PriceMap];
          const price = d
            ? "$" +
              d.usd.toLocaleString("en-US", {
                maximumFractionDigits: d.usd > 100 ? 0 : 2,
              })
            : status === "unavailable"
              ? "—"
              : "···";
          const chg = d?.usd_24h_change;
          return (
            <div key={id} className="flex items-baseline gap-2 text-[12px]">
              <span className="w-7 tracking-wide text-muted">{sym}</span>
              <span className="font-heading tabular-nums text-bone-dim">{price}</span>
              {chg !== undefined && (
                <span
                  className={`text-[10px] tabular-nums ${chg >= 0 ? "text-[#8fae82]" : "text-[#c47a7a]"}`}
                >
                  {chg >= 0 ? "+" : ""}
                  {chg.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      {status === "unavailable" && (
        <p className="mt-2 text-[10px] italic text-muted">
          Piyasa verisine şu an ulaşılamıyor.
        </p>
      )}
    </div>
  );
}

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

export function FinancePulse() {
  const [prices, setPrices] = useState<PriceMap>({});

  useEffect(() => {
    let cancelled = false;

    const fetchPrices = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await res.json();
        if (!cancelled) setPrices(data);
      } catch {
        /* silent */
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
      <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
        Finance Pulse
      </p>
      <div className="flex flex-col gap-1.5">
        {COINS.map(({ id, sym }) => {
          const d = prices[id as keyof PriceMap];
          const price = d
            ? "$" +
              d.usd.toLocaleString("en-US", {
                maximumFractionDigits: d.usd > 100 ? 0 : 2,
              })
            : "···";
          const chg = d?.usd_24h_change;
          return (
            <div key={id} className="flex items-baseline gap-2 text-[12px]">
              <span className="w-7 tracking-wide text-muted">{sym}</span>
              <span className="font-heading text-bone-dim">{price}</span>
              {chg !== undefined && (
                <span
                  className={`text-[10px] ${chg >= 0 ? "text-[#8fae82]" : "text-[#c47a7a]"}`}
                >
                  {chg >= 0 ? "+" : ""}
                  {chg.toFixed(1)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

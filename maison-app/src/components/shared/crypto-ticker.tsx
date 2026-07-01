"use client";

import { useState, useEffect, useCallback } from "react";

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

export function CryptoTicker() {
  const [prices, setPrices] = useState<PriceMap>({});

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true"
      );
      const data = await res.json();
      setPrices(data);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  return (
    <div className="fixed bottom-[22px] left-[22px] z-50 flex gap-4 rounded-[3px] border border-line bg-ink/70 px-3.5 py-2.5 text-[11px] backdrop-blur-sm">
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
          <div key={id} className="flex items-center gap-1.5 text-bone-dim">
            <span className="tracking-wide text-muted">{sym}</span>
            <span className="font-heading text-bone">{price}</span>
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
  );
}

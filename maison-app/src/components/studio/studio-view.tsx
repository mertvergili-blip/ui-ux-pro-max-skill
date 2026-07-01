"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

function HeadlineReveal() {
  const words = "Bugün sakin bir gün. Bir teslim tarihi *yaklaşıyor.*".split(" ");

  return (
    <h1 className="mb-9 max-w-[600px] font-heading text-[46px] font-normal leading-[1.12] tracking-tight text-[#f7f2e6]">
      {words.map((w, i) => {
        const isEm = w.includes("*");
        const clean = w.replace(/\*/g, "");
        return (
          <span key={i}>
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.08,
                ease: [0.2, 0.7, 0.3, 1],
              }}
            >
              {isEm ? <em className="italic text-gold">{clean}</em> : clean}
            </motion.span>{" "}
          </span>
        );
      })}
    </h1>
  );
}

function TaskItem({
  idx,
  text,
  defaultDone,
}: {
  idx: string;
  text: string;
  defaultDone?: boolean;
}) {
  const [done, setDone] = useState(defaultDone ?? false);

  return (
    <div
      className="group flex cursor-pointer select-none items-center gap-3.5 text-[13.5px]"
      onClick={() => setDone(!done)}
    >
      <span className="w-3.5 font-serif text-xs italic text-muted">{idx}</span>
      <span
        className={`relative flex h-[15px] w-[15px] flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 group-hover:scale-[1.15] ${
          done
            ? "border-gold bg-gold"
            : "border-gold bg-transparent"
        }`}
      >
        <svg viewBox="0 0 16 16" className="h-full w-full">
          <path
            d="M4 8.5l2.8 2.8L12 5.5"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.4"
            strokeDasharray="20"
            strokeDashoffset={done ? 0 : 20}
            className="transition-all duration-300"
          />
        </svg>
      </span>
      <span
        className={`relative transition-colors duration-300 ${
          done ? "text-[#57503f] line-through" : "text-[#d7cfbc]"
        }`}
      >
        {text}
      </span>
    </div>
  );
}

function StreakCounter({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let n = 0;
    const tick = () => {
      n++;
      setCount(n);
      if (n < target) setTimeout(tick, 70);
    };
    setTimeout(tick, 900);
  }, [target]);

  return (
    <p className="font-heading text-[28px]">
      {count}
      <small className="ml-1.5 font-sans text-xs text-muted">gün</small>
    </p>
  );
}

export function StudioView() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState("");

  const openChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen) {
      typeText(
        "Seni dinliyorum. Bugünü, stresini ya da bir fikri anlat — görevlerine, takvimine ya da koleksiyonlarına ben ekleyeyim."
      );
    }
  };

  const typeText = (str: string) => {
    setChatText("");
    let i = 0;
    const iv = setInterval(() => {
      setChatText(str.slice(0, i) + "▌");
      i++;
      if (i > str.length) {
        clearInterval(iv);
        setChatText(str);
      }
    }, 16);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
      className="pr-14"
    >
      <p className="mb-[18px] flex items-center gap-2.5 text-[10.5px] uppercase tracking-[3px] text-gold">
        <span className="h-px w-7 bg-gold" />
        From the Studio Assistant
      </p>

      <HeadlineReveal />

      <div className="flex gap-[50px]">
        <div className="flex-[1.3]">
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Studio Focus
          </p>
          <p className="mb-2.5 font-heading text-[22px]">
            Koleksiyon III — Moodboard Revizyonu
          </p>
          <p className="mb-6 max-w-[380px] text-[13.5px] leading-relaxed text-bone-dim">
            Kumaş referanslarını gözden geçir, palet notlarını netleştir.
          </p>
          <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
            Today
          </p>
          <div className="flex flex-col gap-3.5">
            <TaskItem idx="01" text="Brief · Croquis taslaklarını tamamla" />
            <TaskItem
              idx="02"
              text="Ritual · Sabah moodboard incelemesi"
              defaultDone
            />
            <TaskItem
              idx="03"
              text="Creative Challenge · 3 yeni referans topla"
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 border-l border-line pl-7">
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Streak
            </p>
            <StreakCounter target={12} />
          </div>
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Creative Energy
            </p>
            <p className="font-serif text-lg italic text-gold">Flowing</p>
          </div>
          <div>
            <p className="mb-3.5 text-[9.5px] uppercase tracking-[3px] text-muted">
              Next Deadline
            </p>
            <p className="font-heading text-[15px]">Koleksiyon III</p>
            <p className="mt-0.5 text-[11.5px] text-muted">6 gün kaldı</p>
          </div>
        </div>
      </div>

      <div
        className="mt-11 inline-flex cursor-pointer items-center gap-3 text-[10.5px] uppercase tracking-[2.5px] text-muted"
        onClick={openChat}
      >
        <span className="h-1.5 w-1.5 animate-[pulse-glow_2.4s_infinite] rounded-full bg-gold" />
        <span>Talk to your Studio</span>
      </div>

      <div
        className="max-w-[500px] overflow-hidden transition-all duration-500"
        style={{
          maxHeight: chatOpen ? 150 : 0,
          transitionTimingFunction: "cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <div className="mt-3.5 rounded-[3px] border border-line p-4">
          <div className="min-h-[20px] text-[13px] leading-relaxed text-bone-dim">
            {chatText}
          </div>
          <input
            className="mt-3 w-full border-t border-line bg-transparent pt-3 text-[13px] text-bone outline-none placeholder:text-muted"
            placeholder="Bugünü anlat, gerisini ben hallederim…"
          />
        </div>
      </div>
    </motion.div>
  );
}

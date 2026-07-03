"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export interface TimelineEntry {
  title: string;
  content: ReactNode;
}

// Sticky-scroll year timeline (Aceternity's Timeline pattern, reconstructed):
// left column year labels stay pinned while a growing accent line traces
// scroll progress down a spine on the right of the label column.
export function Timeline({ data }: { data: TimelineEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setHeight(entries[0].contentRect.height);
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 75%", "end 40%"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], [0, height]);
  const lineOpacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div ref={containerRef} className="w-full">
      <div ref={contentRef} className="relative">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start gap-8 pt-16 first:pt-0 md:gap-10">
            <div className="sticky top-24 z-10 flex h-fit w-[110px] flex-col items-start self-start md:w-[160px]">
              <div className="mb-2 h-2.5 w-2.5 rounded-full border border-gold/50 bg-ink shadow-[0_0_0_4px_rgba(196,164,105,0.08)]" />
              <p className="font-serif text-xl italic text-bone-dim md:text-2xl">{item.title}</p>
            </div>
            <div className="w-full pl-4 pr-4 md:pl-0">{item.content}</div>
          </div>
        ))}

        <div
          style={{ height: height + "px" }}
          className="absolute left-[4px] top-0 w-px overflow-hidden bg-gradient-to-b from-transparent via-line to-transparent md:left-[4px]"
        >
          <motion.div
            style={{ height: lineHeight, opacity: lineOpacity }}
            className="absolute inset-x-0 top-0 w-px bg-gradient-to-b from-gold via-gold/60 to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

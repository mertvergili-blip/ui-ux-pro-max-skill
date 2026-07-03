"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";

const REVEAL_WIDTH = 80;

// Sits behind the draggable card, revealed as the card slides left. Its own
// width/opacity track the drag position directly — it doesn't just sit
// there as a static box, because callers like Collections' folder info row
// have no opaque background to hide it behind at rest.
export function SwipeDeleteBackdrop({
  x,
  label = "Sil",
}: {
  x: MotionValue<number>;
  label?: string;
}) {
  const width = useTransform(x, (v) => Math.min(-Math.min(v, 0), REVEAL_WIDTH));
  const opacity = useTransform(x, [0, -16, -REVEAL_WIDTH], [0, 0.5, 1]);

  return (
    <motion.div
      aria-hidden
      style={{ width, opacity }}
      className="absolute inset-y-0 right-0 z-0 flex items-center justify-center overflow-hidden rounded-[inherit] bg-rose text-[10px] uppercase tracking-[1.5px] text-ink lg:hidden"
    >
      <div className="flex w-20 flex-shrink-0 items-center justify-center gap-1">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M4 7h16M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7m-9 0 .7 12.1c.05.98.86 1.9 1.85 1.9h6.9c.99 0 1.8-.92 1.85-1.9L18.5 7"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label}
      </div>
    </motion.div>
  );
}

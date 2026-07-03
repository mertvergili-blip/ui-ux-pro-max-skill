import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // iOS applies its own corner mask on top of this — a flat fill
          // (no transparency) is what Apple's guidance recommends.
          background:
            "radial-gradient(circle at 50% 38%, rgba(196,164,105,0.22), transparent 62%), #100d09",
        }}
      >
        {/* Same "M" mark as the entrance monogram (see
            components/intro/entrance-monogram.tsx), rendered static. */}
        <svg width="58%" height="58%" viewBox="0 0 72 72" fill="none">
          <path
            d="M18 60 L18 12 L36 42 L54 12 L54 60"
            stroke="#c4a469"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}

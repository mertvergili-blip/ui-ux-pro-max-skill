import { ImageResponse } from "next/og";

// A dedicated 192x192 rendering of the same "M" mark as icon.tsx/apple-icon.tsx
// — the web app manifest needs at least a 192 and a 512 size for Android's
// "installable" criteria, and the special icon.tsx file convention only
// covers one browser-facing favicon size, so this is a plain route instead.
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 38%, rgba(196,164,105,0.22), transparent 62%), #100d09",
        }}
      >
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
    { width: 192, height: 192 }
  );
}

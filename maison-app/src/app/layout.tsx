import type { Metadata } from "next";
import { Josefin_Sans, Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const josefin = Josefin_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Manrope over Inter — Inter is the default-everywhere UI font; Manrope has
// the same legibility at small sizes but a more crafted, editorial character
// that fits the atelier aesthetic instead of reading as a template.
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison — Your Creative Studio",
  description:
    "A fashion-forward personal life management app. Your atelier, digitized.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${josefin.variable} ${instrument.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-bone overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

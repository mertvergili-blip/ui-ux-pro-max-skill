import type { Metadata } from "next";
import { Josefin_Sans, Instrument_Serif, Inter } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
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
      className={`${josefin.variable} ${instrument.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ink text-bone overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}

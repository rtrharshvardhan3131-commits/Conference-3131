import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Figtree, Newsreader } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "The SOVEREIGN Summit",
    template: "%s · The SOVEREIGN Summit",
  },
  description:
    "Two Days. One Summit. A District United. Rotaract District 3131, 13–14 February 2027.",
  openGraph: {
    title: "The SOVEREIGN Summit",
    description: "Two Days. One Summit. A District United. 13–14 February 2027. Venue coming soon.",
  },
  twitter: {
    card: "summary_large_image",
    title: "The SOVEREIGN Summit",
    description: "Two Days. One Summit. A District United. 13–14 February 2027.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

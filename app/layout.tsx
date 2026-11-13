import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Archivo({ subsets: ["latin"], variable: "--font-display", axes: ["wdth"] });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Garage Fong | Car servicing and repair in Rose Hill, Mauritius",
  description:
    "Father-and-son garage in Beau Bassin-Rose Hill. Honest servicing and repairs, explained as we go. Call 454 5822 or book online.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}

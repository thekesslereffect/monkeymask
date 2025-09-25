import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree, Sniglet, Nunito } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const sniglet = Sniglet({
  weight: ["400", "800"],
  variable: "--font-sniglet",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MonkeyMask - A Banano wallet for the modern Web",
  description: "A Banano wallet for the modern Web",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} ${sniglet.variable} ${nunito.variable} font-figtree font-semibold antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

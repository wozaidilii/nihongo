import "~/styles/globals.css";
import "~/styles/pixel.css";

import { type Metadata, type Viewport } from "next";
import { Press_Start_2P, DotGothic16 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { TRPCReactProvider } from "~/trpc/react";
import { SiteChrome } from "~/components/game/SiteChrome";

export const metadata: Metadata = {
  title: "Chant Hero | Learn Japanese via Chants",
  description:
    "Learn Japanese through hero adventures and chuuni chants: pick a class and cast spells by voice!",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1a1c2c",
};

// 英文/数字：经典 8-bit 像素体
const pressStart = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-press-start",
  display: "swap",
});

// 日文/中文：像素风字体
const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot-gothic",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${pressStart.variable} ${dotGothic.variable}`}>
      <body className="min-h-screen">
        <TRPCReactProvider>
          <SiteChrome>{children}</SiteChrome>
        </TRPCReactProvider>
        <Analytics />
      </body>
    </html>
  );
}

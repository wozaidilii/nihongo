import "~/styles/globals.css";
import "~/styles/pixel.css";

import { type Metadata } from "next";
import { Press_Start_2P, DotGothic16 } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "吟唱勇者 | 中二咒文学日语",
  description: "通过勇者探险与中二咒文学习日语：选择职业，念出咒文释放技能！",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}

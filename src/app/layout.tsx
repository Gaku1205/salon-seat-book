import type { Metadata, Viewport } from "next";
import { Klee_One, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import { SHOP_NAME } from "@/lib/salon";
import "./globals.css";

const mincho = Shippori_Mincho_B1({
  weight: ["700", "800"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-mincho",
  display: "swap",
});

const hand = Klee_One({
  weight: ["400", "600"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-hand",
  display: "swap",
});

const gothic = Zen_Kaku_Gothic_New({
  weight: ["400", "700"],
  subsets: ["latin"],
  preload: false,
  variable: "--font-gothic",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SHOP_NAME}｜ご予約`,
  description: `${SHOP_NAME} の予約帳。メニューと担当と空いた時間を選んで予約できます。`,
};

export const viewport: Viewport = {
  themeColor: "#c39461",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${mincho.variable} ${hand.variable} ${gothic.variable}`}>
      <body>{children}</body>
    </html>
  );
}

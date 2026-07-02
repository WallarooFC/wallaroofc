import type { Metadata, Viewport } from "next";

import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Wallaroo FC Secretary Portal",
    template: "%s · Wallaroo FC",
  },
  description: "Operations portal for the Wallaroo Football Club Secretary.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0a1f3d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}

import { Anton, Bebas_Neue, Fraunces, Inter } from "next/font/google";

export const fontDisplay = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

export const fontHeadline = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-headline",
  display: "swap",
});

export const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const fontBody = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const fontVariables = [
  fontDisplay.variable,
  fontHeadline.variable,
  fontSerif.variable,
  fontBody.variable,
].join(" ");

import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Schibsted_Grotesk, Source_Serif_4 } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { CustomCursor } from "@/components/custom-cursor";
import "react-isokit/styles.css";
import "react-isokit/themes.css";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BluePrint Tech Week",
  description: "BluePrint Tech Week by UBC BizTech.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CustomCursor />
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
        <Analytics />
      </body>
    </html>
  );
}

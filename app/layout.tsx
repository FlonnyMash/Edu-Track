import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { DevTools } from "@/components/DevTools";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Edu Track — Daily Learning Journey",
  description: "AI-powered daily learning planner with gamification",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        {children}
        <DevTools />
      </body>
    </html>
  );
}

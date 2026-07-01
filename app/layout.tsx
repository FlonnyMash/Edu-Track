import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AppToaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
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
    <html lang="en" className={outfit.variable}>
      <body className="font-sans antialiased">
        <div className="app-desktop-frame">{children}</div>
        <AppToaster />
      </body>
    </html>
  );
}

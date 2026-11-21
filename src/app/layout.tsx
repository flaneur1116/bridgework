import type { Metadata, Viewport } from "next";
import "@fontsource-variable/hanken-grotesk";
import "@fontsource-variable/newsreader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bridgework: plan a career switch on evidence",
  description: "Turn your work history into an evidence ledger, compare realistic routes into a new career, and get a plan that adapts.",
};

export const viewport: Viewport = { themeColor: "#08151a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}

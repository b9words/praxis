import DevTools from "@/components/dev/DevTools";
import QueryProvider from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Praxis - Business Acumen Training Platform",
  description: "The proving ground for the next generation of ambitious leaders",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-neutral-800`}
      >
        <QueryProvider>
          {children}
          <Toaster />
          <DevTools />
        </QueryProvider>
      </body>
    </html>
  );
}

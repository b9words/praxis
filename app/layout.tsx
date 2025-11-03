import DevTools from "@/components/dev/DevTools";
import QueryProvider from "@/components/providers/QueryProvider";
import ChannelIOProvider from "@/components/providers/ChannelIOProvider";
import GAProvider from "@/components/providers/GAProvider";
import PostHogPageview from "@/components/providers/PostHogPageview";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL || 'https://execemy.com'
const siteUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Execemy - Business Acumen Training Platform",
    template: "%s | Execemy",
  },
  description: "The proving ground for the next generation of ambitious leaders. Build demonstrable business acumen through systematic training, interactive simulations, and rigorous assessment.",
  openGraph: {
    title: "Execemy - Business Acumen Training Platform",
    description: "The proving ground for the next generation of ambitious leaders. Build demonstrable business acumen through systematic training, interactive simulations, and rigorous assessment.",
    url: siteUrl,
    siteName: "Execemy",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "Execemy - Business Acumen Training Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Execemy - Business Acumen Training Platform",
    description: "The proving ground for the next generation of ambitious leaders. Build demonstrable business acumen through systematic training.",
    images: [`${siteUrl}/og-default.png`],
    creator: "@execemy",
  },
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
          <ChannelIOProvider>
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
            </div>
            <Toaster />
            <DevTools />
            <PostHogPageview />
          </ChannelIOProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}

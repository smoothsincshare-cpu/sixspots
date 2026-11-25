import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "SixSpots - unofficial GTA 6 fan map",
  description: "Players drop pins on hidden cars, side missions and collectibles. Vote up what's real.",
  openGraph: { siteName: "SixSpots", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#0B1020", width: "device-width", initialScale: 1 };

const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="h-full">
        {children}
        {ADSENSE && (
          <Script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`} crossOrigin="anonymous" strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}

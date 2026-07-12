import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remes — El dólar que funciona en todas partes",
  description:
    "Intercambiá USDC y USDT al instante sobre Base. Sin custodia, sin fronteras, en español.",
  applicationName: "Remes Swap",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Remes",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0A4D8C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-bg text-ink">
        <Web3Provider>
          {children}
          <ServiceWorkerRegistrar />
        </Web3Provider>
      </body>
    </html>
  );
}
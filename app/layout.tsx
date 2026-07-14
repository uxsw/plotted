import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Spline_Sans_Mono } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { PwaInstallPromptProvider } from "@/components/PwaInstallPromptProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-spline-mono",
});

export const viewport: Viewport = {
  themeColor: "#2B2A24",
};

export const metadata: Metadata = {
  title: "Plotted",
  description: "Your garden portfolio",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Plotted",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icons/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${splineSansMono.variable} h-full antialiased`}
    > 
      <body className="min-h-full flex flex-col">
        <PwaInstallPromptProvider>
          {children}
        </PwaInstallPromptProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

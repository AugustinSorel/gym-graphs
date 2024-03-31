import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "./header";
import { Providers } from "./providers";
import { Toaster } from "@/components/ui/toaster";
import type { PropsWithChildren } from "react";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gym Graphs",
  description: "Monitor your gym progress with the help of powerfull graphs",
  keywords: ["gym", "gym graphs", "gym monitor", "gym tracker"],
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  manifest: "/manifest.json",
  icons: { apple: "/icon.png" },
};

const RootLayout = ({ children }: PropsWithChildren) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
        <Toaster />
        <Analytics />
        <Script
          defer
          data-domain="gym-graphs.vercel.app"
          src="https://analytics.augustin-sorel.com/js/script.js"
        />
      </body>
    </html>
  );
};

export default RootLayout;

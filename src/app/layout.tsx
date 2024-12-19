import "../styles/globals.css";
import { Inter } from "next/font/google";
import { Header } from "./_components/header";
import { Providers } from "./_components/providers";
import { Toaster } from "@/components/ui/toaster";
import type { PropsWithChildren } from "react";
import type { Metadata } from "next";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gym Graphs",
  description: "Monitor your gym progress with the help of powerfull graphs",
  keywords: ["gym", "gym graphs", "gym monitor", "gym tracker"],
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
        <Script
          defer
          data-website-id="21a8d799-5f6c-4e6b-b24c-6432d02967d6"
          src="https://analytics.augustin-sorel.com/script.js"
        />
      </body>
    </html>
  );
};

export default RootLayout;

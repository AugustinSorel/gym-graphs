import "../styles/globals.css";
import { Inter } from "next/font/google";
import { Header } from "./_components/header";
import { Providers } from "./_components/providers";
import { Toaster } from "@/components/ui/toaster";
import type { PropsWithChildren } from "react";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";

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
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;

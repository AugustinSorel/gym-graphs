"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";
import { WeightUnitProvider } from "@/context/weightUnit";
import { TRPCReactProvider } from "@/trpc/react";

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <TRPCReactProvider>
      <WeightUnitProvider>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </WeightUnitProvider>
    </TRPCReactProvider>
  );
};

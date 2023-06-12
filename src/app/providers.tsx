"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";
import { useSetWeightUnit } from "@/store/weightUnit";

export const Providers = ({ children }: PropsWithChildren) => {
  useSetWeightUnit();

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

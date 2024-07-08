"use client";

import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { SessionProvider, SessionProviderProps } from "next-auth/react";
import { WeightUnitProvider } from "@/context/weightUnit";
import { TRPCReactProvider } from "@/trpc/react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

export const Providers = ({ children }: PropsWithChildren) => {
  return (
    <TRPCReactProvider>
      <WeightUnitProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </WeightUnitProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </TRPCReactProvider>
  );
};

export const AuthProvider = (props: SessionProviderProps) => {
  return <SessionProvider {...props} />;
};

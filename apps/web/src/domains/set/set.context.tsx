import { createContext, use } from "react";
import type { ComponentProps } from "react";
import type { Set } from "@gym-graphs/api/db";

const SetCtx = createContext<Set | undefined>(undefined);

export const SetProvider = (props: ComponentProps<typeof SetCtx>) => {
  return <SetCtx {...props} />;
};

export const useSet = () => {
  const ctx = use(SetCtx);

  if (!ctx) {
    throw new Error("useSet must be wrapped within a <SetProvider/>");
  }

  return ctx;
};

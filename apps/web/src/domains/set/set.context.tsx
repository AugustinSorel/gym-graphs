import { createContext, use } from "react";
import type { ComponentProps } from "react";
import type { SetSuccessSchema } from "@gym-graphs/shared/set/schemas";

const SetCtx = createContext<typeof SetSuccessSchema.Type | undefined>(
  undefined,
);

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

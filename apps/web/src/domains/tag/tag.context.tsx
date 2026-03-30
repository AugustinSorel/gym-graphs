import { createContext, use } from "react";
import type { ComponentProps } from "react";
import { TagSuccessSchema } from "@gym-graphs/shared/tag/schemas";

const Ctx = createContext<
  Pick<typeof TagSuccessSchema.Type, "name" | "id"> | undefined
>(undefined);

export const TagProvider = (props: ComponentProps<typeof Ctx>) => {
  return <Ctx {...props} />;
};

export const useTag = () => {
  const ctx = use(Ctx);

  if (!ctx) {
    throw new Error("useTag must be wrapped within a <TagProvider/>");
  }

  return ctx;
};

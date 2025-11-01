import { createContext, use } from "react";
import type { ComponentProps } from "react";
import type { Tag } from "@gym-graphs/db/schemas";

const Ctx = createContext<Pick<Tag, "name" | "id"> | undefined>(undefined);

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

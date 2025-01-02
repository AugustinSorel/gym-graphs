import { ComponentProps, createContext, useContext } from "react";
import type { User } from "../db/db.schemas";

const UserCtx = createContext<User | undefined>(undefined);

export const UserProvider = (props: ComponentProps<typeof UserCtx>) => {
  return <UserCtx.Provider {...props} />;
};

export const useUser = () => {
  const ctx = useContext(UserCtx);

  if (!ctx) {
    throw new Error("useUser must be wrapped inside of a UserProvider");
  }

  return ctx;
};

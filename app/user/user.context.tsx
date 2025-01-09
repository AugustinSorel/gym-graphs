import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  use,
  useState,
} from "react";
import { validateSessionToken } from "~/auth/auth.services";

type User = NonNullable<
  Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;

type Context = User & { set: Dispatch<SetStateAction<User>> };
const Context = createContext<Context | undefined>(undefined);

export const UserProvider = (props: PropsWithChildren<{ user: User }>) => {
  const [user, setUser] = useState(props.user);

  return <Context value={{ ...user, set: setUser }}>{props.children}</Context>;
};

export const useUser = () => {
  const ctx = use(Context);

  if (!ctx) {
    throw new Error("useUser must be wrapped inside of a UserProvider");
  }

  return ctx;
};

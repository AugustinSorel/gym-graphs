import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useState,
} from "react";
import type { User } from "../db/db.schemas";

type UserCtx = User & { set: Dispatch<SetStateAction<User>> };

const UserCtx = createContext<UserCtx | undefined>(undefined);

export const UserProvider = (props: PropsWithChildren<{ user: User }>) => {
  const [user, setUser] = useState(props.user);

  return (
    <UserCtx.Provider value={{ ...user, set: setUser }}>
      {props.children}
    </UserCtx.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserCtx);

  if (!ctx) {
    throw new Error("useUser must be wrapped inside of a UserProvider");
  }

  return ctx;
};

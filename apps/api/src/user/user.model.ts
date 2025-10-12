import { userTable } from "~/db/db.schemas";
import {
  UserDuplicateEmailErrorr,
  UserNotFoundError,
} from "~/user/user.errors";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const createUserModel = (db: Db) => {
  return {
    createWithEmailAndPassword: async (
      email: User["email"],
      password: NonNullable<User["password"]>,
      salt: NonNullable<User["salt"]>,
      name: User["name"],
    ) => {
      try {
        const [user] = await db
          .insert(userTable)
          .values({ email, password, name, salt })
          .returning();

        if (!user) {
          throw new UserNotFoundError();
        }

        return user;
      } catch (e) {
        if (UserDuplicateEmailErrorr.check(e)) {
          throw new UserDuplicateEmailErrorr();
        }

        throw e;
      }
    },
  };
};

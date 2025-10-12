import { inferNameFromEmail } from "~/user/user.utils";
import {
  generateSalt,
  hashSecret,
  verifySecret,
} from "~/session/session.utils";
import { HTTPException } from "hono/http-exception";
import type { createUserModel } from "~/user/user.model";
import type { SignInSchema, SignUpSchema } from "@gym-graphs/schemas/session";

export const createUserService = (
  model: ReturnType<typeof createUserModel>,
) => {
  return {
    signUpWithEmailAndPassword: async (input: SignUpSchema) => {
      const salt = generateSalt();
      const hashedPassword = await hashSecret(input.password, salt);

      const name = inferNameFromEmail(input.email);

      const user = await model.createWithEmailAndPassword(
        input.email,
        hashedPassword,
        salt,
        name,
      );

      return user;
    },

    signInWithEmailAndPassword: async (input: SignInSchema) => {
      const user = await model.selectByEmail(input.email);

      if (!user) {
        throw new HTTPException(409, {
          message: "email or password is invalid",
        });
      }

      if (!user.emailVerifiedAt) {
        throw new HTTPException(403, {
          message: "email address not verified",
        });
      }

      if (!user.password || !user.salt) {
        throw new HTTPException(403, {
          message: "this account has been set up using oauth",
        });
      }

      const validPassword = await verifySecret(
        input.password,
        user.password,
        user.salt,
      );

      if (!validPassword) {
        throw new HTTPException(403, {
          message: "email or password is invalid",
        });
      }

      return user;
    },
  };
};

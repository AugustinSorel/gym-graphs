import { inferNameFromEmail } from "~/user/user.utils";
import {
  generateSalt,
  hashSecret,
  verifySecret,
} from "~/session/session.utils";
import { HTTPException } from "hono/http-exception";
import { userRepo } from "~/user/user.repo";
import type { SignInSchema, SignUpSchema } from "@gym-graphs/schemas/session";
import type { User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

const signUpWithEmailAndPassword = async (input: SignUpSchema, db: Db) => {
  const salt = generateSalt();
  const hashedPassword = await hashSecret(input.password, salt);

  const name = inferNameFromEmail(input.email);

  const user = await userRepo.createWithEmailAndPassword(
    input.email,
    hashedPassword,
    salt,
    name,
    db,
  );

  if (!user) {
    throw new HTTPException(404, { message: "user not found" });
  }

  return user;
};

const signInWithEmailAndPassword = async (input: SignInSchema, db: Db) => {
  const user = await userRepo.selectByEmail(input.email, db);

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
};

export const userService = {
  signUpWithEmailAndPassword,
  signInWithEmailAndPassword,
};

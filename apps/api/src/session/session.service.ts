import { generateSessionToken } from "~/session/session.utils";
import { fifteenDaysInMs } from "~/utils/dates";
import { sessionRepo } from "~/session/session.repo";
import { HTTPException } from "hono/http-exception";
import {
  generateSalt,
  hashSecret,
  hashSHA256Hex,
  verifySecret,
} from "~/libs/crypto";
import { inferNameFromEmail } from "~/user/user.utils";
import { userRepo } from "~/user/user.repo";
import { seedUserAccount } from "~/user/user.seed";
import { generateEmailVerificationCode } from "~/email-verification/email-verification.utils";
import { emailVerificationRepo } from "~/email-verification/email-verification.repo";
import { emailVerificationEmailBody } from "~/email-verification/email-verification.emails";
import { sendEmail } from "~/libs/email";
import type { SignInSchema, SignUpSchema } from "@gym-graphs/schemas/session";
import type { Email } from "~/libs/email";
import type { Session } from "~/db/db.schemas";
import type { SessionToken } from "~/session/session.utils";
import type { Db } from "~/libs/db";

const signOut = async (sessionId: Session["id"], db: Db) => {
  const session = await sessionRepo.deleteById(sessionId, db);

  if (!session) {
    throw new HTTPException(404, { message: "session not found" });
  }

  return session;
};

const validate = async (candidateSessionToken: SessionToken, db: Db) => {
  const sessionId = hashSHA256Hex(candidateSessionToken);

  const session = await sessionRepo.selectById(sessionId, db);

  if (!session) {
    return null;
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await sessionRepo.deleteById(session.id, db);

    return null;
  }

  const sessionNearExpiry =
    Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

  if (sessionNearExpiry) {
    await sessionRepo.refreshExpiryDate(session.id, db);
  }

  return session;
};

export type SessionCtx = Awaited<ReturnType<typeof validate>>;

const signUp = async (input: SignUpSchema, db: Db, email: Email) => {
  return db.transaction(async (tx) => {
    const salt = generateSalt();
    const hashedPassword = await hashSecret(input.password, salt);

    const name = inferNameFromEmail(input.email);

    const user = await userRepo.createWithEmailAndPassword(
      input.email,
      hashedPassword,
      salt,
      name,
      tx,
    );

    await seedUserAccount(user.id);

    const emailVerificationCode = generateEmailVerificationCode();

    const emailVerification = await emailVerificationRepo.create(
      emailVerificationCode,
      user.id,
      tx,
    );

    await sendEmail(
      [user.email],
      "Verification code",
      emailVerificationEmailBody(emailVerification.code),
      email,
    );

    const token = generateSessionToken();

    const session = await sessionRepo.create(token, user.id, tx);

    return {
      session,
      token,
    };
  });
};

const signIn = async (input: SignInSchema, db: Db) => {
  return db.transaction(async (tx) => {
    const user = await userRepo.selectByEmail(input.email, tx);

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

    const token = generateSessionToken();

    const session = await sessionRepo.create(token, user.id, tx);

    return {
      session,
      token,
    };
  });
};

export const sessionService = {
  validate,
  signUp,
  signIn,
  signOut,
};

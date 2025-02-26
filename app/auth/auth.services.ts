import { base32, encodeHex } from "oslo/encoding";
import { alphabet, generateRandomString, sha256 } from "oslo/crypto";
import { fifteenDaysInMs, thirtyDaysInMs } from "~/utils/date";
import { eq } from "drizzle-orm";
import { emailVerificationCodeTable, sessionTable } from "~/db/db.schemas";
import { passwordResetTokenTable } from "~/db/db.schemas";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import type { Db } from "~/libs/db";
import type {
  EmailVerificationCode,
  PasswordResetToken,
  Session,
  User,
} from "~/db/db.schemas";

export const hashSecret = (input: string, salt: string) => {
  return new Promise<string>((resolve, reject) => {
    scrypt(input.normalize(), salt, 64, (error, hash) => {
      if (error) reject(error);

      resolve(hash.toString("hex").normalize());
    });
  });
};

export const generateSalt = () => {
  return randomBytes(16).toString("hex").normalize();
};

export const verifySecret = async (
  candidateSecret: string,
  hashedSecret: string,
  salt: string,
) => {
  const candidateHashedSecret = await hashSecret(candidateSecret, salt);

  return timingSafeEqual(
    Buffer.from(candidateHashedSecret, "hex"),
    Buffer.from(hashedSecret, "hex"),
  );
};

export const generateSessionToken = () => {
  const bytes = new Uint8Array(20);

  crypto.getRandomValues(bytes);

  const token = base32.encode(bytes, { includePadding: false });

  return token;
};
export type SessionToken = ReturnType<typeof generateSessionToken>;

export const generatePasswordResetToken = () => {
  const bytes = new Uint8Array(20);

  crypto.getRandomValues(bytes);

  const token = base32.encode(bytes, { includePadding: false });

  return token;
};

export const generateEmailVerificationCode = () => {
  return generateRandomString(6, alphabet("0-9"));
};

export const sha256Encode = async (input: string) => {
  return encodeHex(await sha256(new TextEncoder().encode(input)));
};

export const validateSessionToken = async (
  candidateSessionToken: SessionToken,
  db: Db,
) => {
  const sessionId = await sha256Encode(candidateSessionToken);

  const session = await selectSession(sessionId, db);

  if (!session) {
    return null;
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await deleteSession(session.id, db);

    return null;
  }

  const sessionNearExpiry =
    Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

  if (sessionNearExpiry) {
    await refreshSessionExpiryDate(session.id, db);
  }

  return session;
};

export const createSession = async (
  sessionToken: string,
  userId: User["id"],
  db: Db,
) => {
  const sessionId = await sha256Encode(sessionToken);

  const [session] = await db
    .insert(sessionTable)
    .values({ id: sessionId, userId })
    .returning();

  if (!session) {
    throw new Error("session returned by db is null");
  }

  return session;
};

export const deleteSession = async (sessionId: Session["id"], db: Db) => {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

export const deleteSessionByUserId = async (userId: User["id"], db: Db) => {
  return db.delete(sessionTable).where(eq(sessionTable.userId, userId));
};

export const refreshSessionExpiryDate = async (
  sessionId: Session["id"],
  db: Db,
) => {
  await db
    .update(sessionTable)
    .set({ expiresAt: new Date(Date.now() + thirtyDaysInMs) })
    .where(eq(sessionTable.id, sessionId));
};

export const selectSession = async (sessionId: Session["id"], db: Db) => {
  return db.query.sessionTable.findFirst({
    where: eq(sessionTable.id, sessionId),
    with: {
      user: {
        with: {
          dashboard: {
            columns: {
              id: true,
            },
          },
        },
        columns: {
          id: true,
          emailVerifiedAt: true,
          email: true,
        },
      },
    },
  });
};

export const deleteEmailVerificationCodeById = async (
  id: EmailVerificationCode["id"],
  db: Db,
) => {
  return db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.id, id));
};

export const deleteEmailVerificationCodesByUserId = async (
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  return db
    .delete(emailVerificationCodeTable)
    .where(eq(emailVerificationCodeTable.userId, userId));
};

export const createEmailVerificationCode = async (
  code: EmailVerificationCode["code"],
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  const [emailVerification] = await db
    .insert(emailVerificationCodeTable)
    .values({
      userId,
      code,
    })
    .returning();

  if (!emailVerification) {
    throw new Error("email verification returned by db is null");
  }

  return emailVerification;
};

export const selectEmailVerificationCode = async (
  userId: EmailVerificationCode["userId"],
  db: Db,
) => {
  return db.query.emailVerificationCodeTable.findFirst({
    where: eq(emailVerificationCodeTable.userId, userId),
    with: {
      user: {
        columns: {
          email: true,
        },
      },
    },
  });
};

export const deletePasswordResetTokenByUserId = async (
  userId: PasswordResetToken["userId"],
  db: Db,
) => {
  return db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.userId, userId));
};

export const deletePasswordResetTokenByToken = async (
  token: PasswordResetToken["token"],
  db: Db,
) => {
  return db
    .delete(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.token, token));
};

export const selectPasswordResetToken = async (
  token: PasswordResetToken["token"],
  db: Db,
) => {
  return db
    .select()
    .from(passwordResetTokenTable)
    .where(eq(passwordResetTokenTable.token, token));
};

export const createPasswordResetToken = async (
  token: PasswordResetToken["token"],
  userId: PasswordResetToken["userId"],
  db: Db,
) => {
  return db.insert(passwordResetTokenTable).values({ token, userId });
};

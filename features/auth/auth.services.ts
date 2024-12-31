import { sessionTable, type Session } from "~/db/schema";
import { base32, encodeHex } from "oslo/encoding";
import type { Db } from "~/db/db";
import { sha256 } from "oslo/crypto";
import { eq } from "drizzle-orm";
import { hash, compare, genSalt } from "bcrypt";
import {
  deleteSession,
  refreshSessionExpiryDate,
  selectSessionWithUser,
} from "../session/session.services";
import { fifteenDaysInMs } from "~/utils/dates";

export const hashSecret = async (input: string) => {
  const salt = await genSalt(10);

  const hashedPassword = await hash(input, salt);

  return hashedPassword;
};

export const verifySecret = async (
  candidateSecret: string,
  encryptedSecret: string,
) => {
  return await compare(candidateSecret, encryptedSecret);
};

export const generateSessionToken = () => {
  const bytes = new Uint8Array(20);

  crypto.getRandomValues(bytes);

  const token = base32.encode(bytes, { includePadding: false });

  return token;
};

export type SessionToken = ReturnType<typeof generateSessionToken>;

export const sha256Encode = async (input: string) => {
  return encodeHex(await sha256(new TextEncoder().encode(input)));
};

export const validateSessionToken = async (
  candidateSessionToken: SessionToken,
  db: Db,
) => {
  const sessionId = await sha256Encode(candidateSessionToken);

  const session = await selectSessionWithUser(sessionId, db);

  if (!session) {
    return { session: null, user: null };
  }

  const sessionExpired = Date.now() >= session.expiresAt.getTime();

  if (sessionExpired) {
    await deleteSession(session.id, db);

    return { session: null, user: null };
  }

  const sessionNearExpiry =
    Date.now() >= session.expiresAt.getTime() - fifteenDaysInMs;

  if (sessionNearExpiry) {
    refreshSessionExpiryDate(session.id, db);
  }

  return { session, user: session.user };
};

export const invalidateSession = async (sessionId: Session["id"], db: Db) => {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
};

import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    session: r.one.sessions({
      from: r.users.id,
      to: r.sessions.userId,
      optional: false,
    }),
    verificationCode: r.one.verificationCodes({
      from: r.users.id,
      to: r.verificationCodes.userId,
    }),
    passwordResetToken: r.one.passwordResetTokens({
      from: r.users.id,
      to: r.passwordResetTokens.userId,
    }),
  },

  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
      optional: false,
    }),
  },

  verificationCodes: {
    user: r.one.users({
      from: r.verificationCodes.userId,
      to: r.users.id,
    }),
  },

  passwordResetTokens: {
    user: r.one.users({
      from: r.passwordResetTokens.userId,
      to: r.users.id,
    }),
  },
}));

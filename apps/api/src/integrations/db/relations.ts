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
    oauthAccounts: r.many.oauthAccounts(),
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

  oauthAccounts: {
    user: r.one.users({
      from: r.oauthAccounts.userId,
      to: r.users.id,
    }),
  },

  tags: {
    user: r.one.users({
      from: r.tags.userId,
      to: r.users.id,
      optional: false,
    }),
    exercises: r.many.exercises({
      from: r.tags.id.through(r.exercisesToTags.tagId),
      to: r.exercises.id.through(r.exercisesToTags.exerciseId),
    }),
  },

  exercises: {
    user: r.one.users({
      from: r.exercises.userId,
      to: r.users.id,
      optional: false,
    }),
    tags: r.many.tags({
      from: r.exercises.id.through(r.exercisesToTags.exerciseId),
      to: r.tags.id.through(r.exercisesToTags.tagId),
    }),
    sets: r.many.sets(),
  },

  sets: {
    exercise: r.one.exercises({
      from: r.sets.exerciseId,
      to: r.exercises.id,
      optional: false,
    }),
  },
}));

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
    tags: r.many.tags(),
    dashboardTiles: r.many.dashboardTiles(),
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
    dashboardTiles: r.many.dashboardtilesToTags(),
  },
  dashboardTiles: {
    user: r.one.users({
      from: r.dashboardTiles.userId,
      to: r.users.id,
      optional: false,
    }),
    tags: r.many.dashboardtilesToTags(),
    exercise: r.one.exercises({
      from: r.dashboardTiles.exerciseId,
      to: r.exercises.id,
    }),
  },
  dashboardtilesToTags: {
    dashboardTile: r.one.dashboardTiles({
      from: r.dashboardtilesToTags.dashboardTileId,
      to: r.dashboardTiles.id,
      optional: false,
    }),
    tag: r.one.tags({
      from: r.dashboardtilesToTags.tagId,
      to: r.tags.id,
      optional: false,
    }),
  },

  exercises: {
    dashboardTile: r.one.dashboardTiles({
      from: r.exercises.id,
      to: r.dashboardTiles.exerciseId,
      optional: false,
    }),
  },
}));

import { Database, isUniqueViolation } from "#/integrations/db/db";
import {
  dashboardtilesToTags,
  tags,
  type DashboardTile,
  type Tag,
} from "#/integrations/db/schema";
import { DuplicateTag, TagNotFound } from "@gym-graphs/shared/tag/errors";
import { and, eq } from "drizzle-orm";
import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import { Effect, Array } from "effect";

export class TagRepo extends Effect.Service<TagRepo>()("TagRepo", {
  accessors: true,
  effect: Effect.gen(function* () {
    const db = yield* Database;

    return {
      create: (input: PgInsertValue<typeof tags>) => {
        return db
          .insert(tags)
          .values(input)
          .returning()
          .pipe(
            Effect.catchIf(
              (e) => isUniqueViolation(e, "tag_name_user_id_unique"),
              () => DuplicateTag.withName(input.name.toString()),
            ),
            Effect.andThen((rows) => Array.head(rows).pipe(Effect.orDie)),
          );
      },

      createMany: (input: Array<PgInsertValue<typeof tags>>) => {
        return db.insert(tags).values(input).returning();
      },

      selectAll: (userId: Tag["userId"]) => {
        return db.query.tags.findMany({
          extras: {
            exerciseCount: (table) => {
              return db.$count(
                dashboardtilesToTags,
                eq(table.id, dashboardtilesToTags.tagId),
              );
            },
          },
          where: {
            userId,
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      },

      selectTileTags: (
        tileId: DashboardTile["id"],
        userId: DashboardTile["userId"],
      ) => {
        return db.query.tags.findMany({
          where: {
            dashboardTiles: {
              dashboardTile: {
                AND: [{ id: tileId }, { userId }],
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      },

      deleteByTagId: (tagId: Tag["id"], userId: Tag["userId"]) => {
        return db
          .delete(tags)
          .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
          .returning()
          .pipe(
            Effect.andThen((rows) =>
              Array.head(rows).pipe(Effect.mapError(() => new TagNotFound())),
            ),
          );
      },

      patchByTagId: (
        payload: PgUpdateSetSource<typeof tags>,
        tagId: Tag["id"],
        userId: Tag["userId"],
      ) => {
        return db
          .update(tags)
          .set(payload)
          .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
          .returning()
          .pipe(
            Effect.andThen((rows) =>
              Array.head(rows).pipe(Effect.mapError(() => new TagNotFound())),
            ),
          );
      },
    };
  }),
}) {}

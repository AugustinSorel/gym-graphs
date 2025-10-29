import { and, asc, eq, exists } from "drizzle-orm";
import {
  dashboardTable,
  exerciseTable,
  setTable,
  tagTable,
  tileTable,
} from "~/db/db.schemas";
import type { Db } from "~/libs/db";
import type { Dashboard, Exercise } from "~/db/db.schemas";

const create = async (db: Db) => {
  const [exercise] = await db.insert(exerciseTable).values({}).returning();

  if (!exercise) {
    throw new Error("exercise returned by db is null");
  }

  return exercise;
};

const selectById = async (
  userId: Dashboard["userId"],
  exerciseId: Exercise["id"],
  db: Db,
) => {
  const userExercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, exerciseId))
    .where(eq(dashboardTable.userId, userId));

  return db.query.exerciseTable.findFirst({
    where: and(eq(exerciseTable.id, exerciseId), exists(userExercise)),
    with: {
      exerciseOverviewTile: {
        with: {
          tile: {
            with: {
              tileToTags: {
                orderBy: asc(tagTable.createdAt),
                with: {
                  tag: true,
                },
              },
            },
          },
        },
      },

      sets: {
        orderBy: asc(setTable.doneAt),
      },
    },
  });
};

const createMany = async (
  data: Array<typeof exerciseTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(exerciseTable).values(data).returning();
};

export const exerciseRepo = {
  create,
  createMany,
  selectById,
};

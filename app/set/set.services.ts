import { eq, and, exists, getTableColumns, asc, gte, lte } from "drizzle-orm";
import {
  setTable,
  exerciseTable,
  dashboardTable,
  tileTable,
} from "~/db/db.schemas";
import { getCalendarPositions, getFirstDayOfMonth } from "~/utils/date";
import type { Dashboard, Set, User } from "~/db/db.schemas";
import type { Db } from "~/libs/db";

export const createSet = async (
  weightInKg: Set["weightInKg"],
  repetitions: Set["repetitions"],
  exerciseId: Set["exerciseId"],
  db: Db,
) => {
  return db.insert(setTable).values({ weightInKg, repetitions, exerciseId });
};

export const createSets = async (
  set: Array<typeof setTable.$inferInsert>,
  db: Db,
) => {
  return db.insert(setTable).values(set);
};

export const updateSetWeight = async (
  setId: Set["id"],
  userId: User["id"],
  weightInKg: Set["weightInKg"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const updatedSets = await db
    .update(setTable)
    .set({ weightInKg })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedSets;
};

export const updateSetRepetitions = async (
  setId: Set["id"],
  userId: User["id"],
  repetitions: Set["repetitions"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const updatedExerciseSets = await db
    .update(setTable)
    .set({ repetitions })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const updateSetDoneAt = async (
  setId: Set["id"],
  userId: User["id"],
  doneAt: Set["doneAt"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const updatedExerciseSets = await db
    .update(setTable)
    .set({ doneAt })
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const deleteSet = async (
  setId: Set["id"],
  userId: User["id"],
  db: Db,
) => {
  const exercise = db
    .select()
    .from(dashboardTable)
    .innerJoin(tileTable, eq(tileTable.dashboardId, dashboardTable.id))
    .innerJoin(exerciseTable, eq(exerciseTable.id, tileTable.exerciseId))
    .innerJoin(setTable, eq(setTable.id, setId))
    .where(eq(dashboardTable.userId, userId));

  const updatedExerciseSets = await db
    .delete(setTable)
    .where(and(eq(setTable.id, setId), exists(exercise)))
    .returning();

  if (!updatedExerciseSets.length) {
    throw new Error("exercise set not found");
  }

  return updatedExerciseSets;
};

export const selectSetsForThisMonth = async (
  userId: Dashboard["userId"],
  db: Db,
) => {
  return db
    .select(getTableColumns(setTable))
    .from(exerciseTable)
    .innerJoin(
      setTable,
      and(
        eq(setTable.exerciseId, exerciseTable.id),
        gte(setTable.doneAt, getFirstDayOfMonth()),
        lte(setTable.doneAt, new Date()),
      ),
    )
    .innerJoin(dashboardTable, eq(dashboardTable.userId, userId))
    .where(eq(dashboardTable.userId, userId))
    .orderBy(asc(setTable.doneAt));
};

const generateSetsHeatMapTemplate = () => {
  const days = [0, 1, 2, 3, 4, 5, 6] as const;
  const weeks = [0, 1, 2, 3, 4, 5] as const;

  return days.map((dayIndex) => ({
    dayIndex,
    bins: weeks.map((weekIndex) => ({
      weekIndex,
      count: 0,
    })),
  }));
};

export const transformSetsToHeatMap = (sets: ReadonlyArray<Set>) => {
  const setsHeatMapTemplate = generateSetsHeatMapTemplate();

  return sets
    .reduce(setsToHeatMap, setsHeatMapTemplate)
    .toSorted((a, b) => a.dayIndex - b.dayIndex)
    .map((row) => ({
      ...row,
      bins: row.bins.toSorted((a, b) => b.weekIndex - a.weekIndex),
    }));
};

const setsToHeatMap = (
  setsHeatMap: ReturnType<typeof generateSetsHeatMapTemplate>,
  set: Set,
) => {
  const calendarPositions = getCalendarPositions(set.doneAt);

  return setsHeatMap.map((row) => {
    if (row.dayIndex === calendarPositions.day) {
      return {
        dayIndex: row.dayIndex,
        bins: row.bins.map((cell) => {
          if (cell.weekIndex === calendarPositions.week) {
            return {
              weekIndex: cell.weekIndex,
              count: cell.count + 1,
            };
          }

          return cell;
        }),
      };
    }

    return row;
  });
};

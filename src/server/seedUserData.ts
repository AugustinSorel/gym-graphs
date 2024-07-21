import { addDays, addMonths, dateAsYearMonthDayFormat } from "@/lib/date";
import type { User } from "next-auth";
import { db, type Db } from "./db";
import {
  exerciseGridPosition,
  exercises,
  exercisesData,
  userStats,
} from "./db/schema";
import { syncUserStats } from "./syncUsersStats";

export const seedUserData = async ({ id }: Pick<User, "id">) => {
  await db.transaction(async (tx) => {
    await insertUserStats(tx, id);

    const { benchPress, deadlift, squat } = await insertExercises(tx, id);

    await insertBenchPrenchData(tx, benchPress.id, id);
    await insertSquatData(tx, squat.id, id);
    await insertDeadliftData(tx, deadlift.id, id);

    await syncUserStats(tx, id);
  });
};

const insertUserStats = async (db: Db, userId: string) => {
  await db.insert(userStats).values({
    numberOfExercisesCreated: 0,
    amountOfWeightLifted: 0,
    numberOfDataLogged: 0,
    numberOfDays: 0,
    numberOfRepetitionsMade: 0,
    userId,
  });
};

const insertExercises = async (db: Db, userId: string) => {
  const [benchPress, squat, deadlift] = await db
    .insert(exercises)
    .values([
      { name: "bench press", userId },
      { name: "squat", userId },
      { name: "deadlift", userId },
    ])
    .returning();

  if (!benchPress) {
    throw new Error("benchPress is not defined");
  }

  if (!squat) {
    throw new Error("squat is not defined");
  }

  if (!deadlift) {
    throw new Error("deadlift is not defined");
  }

  return { benchPress, squat, deadlift };
};

const insertBenchPrenchData = async (
  db: Db,
  benchPressId: string,
  userId: string,
) => {
  await db
    .insert(exerciseGridPosition)
    .values({ exerciseId: benchPressId, userId });

  await db.insert(exercisesData).values([
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 20,
      weightLifted: 20,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 0)),
      createdAt: addDays(addMonths(new Date(), -1), 0),
      updatedAt: addDays(addMonths(new Date(), -1), 0),
    },
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 10,
      weightLifted: 10,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 1)),
      createdAt: addDays(addMonths(new Date(), -1), 1),
      updatedAt: addDays(addMonths(new Date(), -1), 1),
    },
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 30,
      weightLifted: 30,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 2)),
      createdAt: addDays(addMonths(new Date(), -1), 2),
      updatedAt: addDays(addMonths(new Date(), -1), 2),
    },
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 20,
      weightLifted: 20,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 0)),
      createdAt: addDays(addMonths(new Date(), -2), 0),
      updatedAt: addDays(addMonths(new Date(), -2), 0),
    },
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 10,
      weightLifted: 10,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 1)),
      createdAt: addDays(addMonths(new Date(), -2), 1),
      updatedAt: addDays(addMonths(new Date(), -2), 1),
    },
    {
      exerciseId: benchPressId,
      numberOfRepetitions: 30,
      weightLifted: 30,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 2)),
      createdAt: addDays(addMonths(new Date(), -2), 2),
      updatedAt: addDays(addMonths(new Date(), -2), 2),
    },
  ]);
};

const insertSquatData = async (db: Db, squatId: string, userId: string) => {
  await db.insert(exerciseGridPosition).values({ exerciseId: squatId, userId });

  await db.insert(exercisesData).values([
    {
      exerciseId: squatId,
      numberOfRepetitions: 10,
      weightLifted: 10,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 0)),
      createdAt: addDays(addMonths(new Date(), -1), 0),
      updatedAt: addDays(addMonths(new Date(), -1), 0),
    },
    {
      exerciseId: squatId,
      numberOfRepetitions: 30,
      weightLifted: 30,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 1)),
      createdAt: addDays(addMonths(new Date(), -1), 1),
      updatedAt: addDays(addMonths(new Date(), -1), 1),
    },
    {
      exerciseId: squatId,
      numberOfRepetitions: 20,
      weightLifted: 20,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 2)),
      createdAt: addDays(addMonths(new Date(), -1), 2),
      updatedAt: addDays(addMonths(new Date(), -1), 2),
    },
    {
      exerciseId: squatId,
      numberOfRepetitions: 20,
      weightLifted: 20,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 0)),
      createdAt: addDays(addMonths(new Date(), -2), 0),
      updatedAt: addDays(addMonths(new Date(), -2), 0),
    },
    {
      exerciseId: squatId,
      numberOfRepetitions: 40,
      weightLifted: 40,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 2)),
      createdAt: addDays(addMonths(new Date(), -2), 2),
      updatedAt: addDays(addMonths(new Date(), -2), 2),
    },
  ]);
};

const insertDeadliftData = async (
  db: Db,
  deadliftId: string,
  userId: string,
) => {
  await db
    .insert(exerciseGridPosition)
    .values({ exerciseId: deadliftId, userId });

  await db.insert(exercisesData).values([
    {
      exerciseId: deadliftId,
      numberOfRepetitions: 30,
      weightLifted: 30,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 0)),
      createdAt: addDays(addMonths(new Date(), -1), 0),
      updatedAt: addDays(addMonths(new Date(), -1), 0),
    },
    {
      exerciseId: deadliftId,
      numberOfRepetitions: 50,
      weightLifted: 50,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -1), 2)),
      createdAt: addDays(addMonths(new Date(), -1), 2),
      updatedAt: addDays(addMonths(new Date(), -1), 2),
    },
    {
      exerciseId: deadliftId,
      numberOfRepetitions: 40,
      weightLifted: 40,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 0)),
      createdAt: addDays(addMonths(new Date(), -2), 0),
      updatedAt: addDays(addMonths(new Date(), -2), 0),
    },
    {
      exerciseId: deadliftId,
      numberOfRepetitions: 30,
      weightLifted: 30,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 1)),
      createdAt: addDays(addMonths(new Date(), -2), 1),
      updatedAt: addDays(addMonths(new Date(), -2), 1),
    },
    {
      exerciseId: deadliftId,
      numberOfRepetitions: 20,
      weightLifted: 20,
      doneAt: dateAsYearMonthDayFormat(addDays(addMonths(new Date(), -2), 2)),
      createdAt: addDays(addMonths(new Date(), -2), 2),
      updatedAt: addDays(addMonths(new Date(), -2), 2),
    },
  ]);
};

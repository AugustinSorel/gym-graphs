import { addDays, addMonths } from "@/lib/date";
import type { User } from "next-auth";
import { db } from "./db";
import { exerciseGridPosition, exercises, exercisesData } from "./db/schema";

export const seedUserData = async ({ id }: Pick<User, "id">) => {
  await db.transaction(async (tx) => {
    const [benchPress, squat, deadlift] = await tx
      .insert(exercises)
      .values([
        { name: "bench press", userId: id },
        { name: "squat", userId: id },
        { name: "deadlift", userId: id },
      ])
      .returning();

    if (benchPress) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: benchPress.id, userId: id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -1), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 1),
          updatedAt: addDays(addMonths(new Date(), -1), 1),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -2), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 1),
          updatedAt: addDays(addMonths(new Date(), -2), 1),
        },
        {
          exerciseId: benchPress.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }

    if (squat) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: squat.id, userId: id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: squat.id,
          numberOfRepetitions: 10,
          weightLifted: 10,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 1),
          updatedAt: addDays(addMonths(new Date(), -1), 1),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: squat.id,
          numberOfRepetitions: 40,
          weightLifted: 40,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }

    if (deadlift) {
      await tx
        .insert(exerciseGridPosition)
        .values({ exerciseId: deadlift.id, userId: id });

      await tx.insert(exercisesData).values([
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -1), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 0),
          updatedAt: addDays(addMonths(new Date(), -1), 0),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 50,
          weightLifted: 50,
          doneAt: addDays(addMonths(new Date(), -1), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -1), 2),
          updatedAt: addDays(addMonths(new Date(), -1), 2),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 40,
          weightLifted: 40,
          doneAt: addDays(addMonths(new Date(), -2), 0).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 0),
          updatedAt: addDays(addMonths(new Date(), -2), 0),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 30,
          weightLifted: 30,
          doneAt: addDays(addMonths(new Date(), -2), 1).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 1),
          updatedAt: addDays(addMonths(new Date(), -2), 1),
        },
        {
          exerciseId: deadlift.id,
          numberOfRepetitions: 20,
          weightLifted: 20,
          doneAt: addDays(addMonths(new Date(), -2), 2).toString(),
          createdAt: addDays(addMonths(new Date(), -2), 2),
          updatedAt: addDays(addMonths(new Date(), -2), 2),
        },
      ]);
    }
  });
};

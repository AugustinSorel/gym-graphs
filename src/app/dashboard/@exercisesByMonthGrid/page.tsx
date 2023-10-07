import { db } from "@/db";
import type { ExerciseWithData, User } from "@/db/types";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { MonthGrid } from "./monthGrid";
import { dateAsYearMonthDayFormat } from "@/lib/date";

//TODO: infinte scroll
const ExercisesByMonthGrid = async () => {
  const session = await getServerSession(authOptions);

  if (!session || !session.user.id) {
    return redirect("/");
  }

  const exercises = await getExercises(session.user.id);

  return (
    <>
      {getExercisesByMonth(exercises).map((group) => (
        <MonthGrid
          key={dateAsYearMonthDayFormat(group.date)}
          exerciseByMonth={group}
        />
      ))}
    </>
  );
};

export default ExercisesByMonthGrid;

type ExercisesByMonth = {
  date: Date;
  exercises: ExerciseWithData[];
}[];

const getExercisesByMonth = (exercises: ExerciseWithData[]) => {
  const exercisesByMonth: ExercisesByMonth = [];

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const firstDayOfMonthDate = new Date(new Date(data.doneAt).setDate(1));

      const entry = exercisesByMonth.find(
        (entry) => entry.date.getTime() === firstDayOfMonthDate.getTime()
      );

      if (!entry) {
        exercisesByMonth.push({
          date: firstDayOfMonthDate,
          exercises: [{ ...exercise, data: [data] }],
        });
        continue;
      }

      const exerciseInEntry = entry.exercises.find(
        (ex) => ex.id === exercise.id
      );

      if (!exerciseInEntry) {
        entry.exercises.push({ ...exercise, data: [data] });
        continue;
      }

      exerciseInEntry.data.push(data);
    }
  }

  return exercisesByMonth.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const getExercises = (userId: User["id"]) => {
  return db.query.exercises.findMany({
    with: {
      data: { orderBy: (data, { desc }) => [desc(data.doneAt)] },
    },
    where: (exercise, { eq }) => eq(exercise.userId, userId),
  });
};

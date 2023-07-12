import type { ExerciseData } from "@/fakeData";

export const keepDataFrom30Days = (data: ExerciseData[]) => {
  return data.filter((d) => {
    const dataDate = new Date(d.date);
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return dataDate >= thirtyDaysAgo && dataDate <= currentDate;
  });
};

export const oneDayInMs = 1_000 * 60 * 60 * 24;
export const fifteenDaysInMs = oneDayInMs * 15;
export const thirtyDaysInMs = oneDayInMs * 30;

export const addDate = (date: Date, by: number) => {
  return new Date(new Date().setDate(date.getDate() + by));
};

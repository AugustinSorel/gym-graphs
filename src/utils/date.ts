export const oneDayInMs = 1_000 * 60 * 60 * 24;
export const fifteenDaysInMs = oneDayInMs * 15;
export const thirtyDaysInMs = oneDayInMs * 30;

export const dateAsYYYYMMDD = (date: Date) => {
  const dateStr = date.toISOString().split("T").at(0);

  if (!dateStr) {
    throw new Error("could not convert date as yyyy-mm-dd");
  }

  return dateStr;
};

export const addDate = (date: Date, by: number) => {
  return new Date(new Date().setDate(date.getDate() + by));
};

export const getFirstDayOfMonth = () => {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
};

export const getLastDayOfMonth = () => {
  return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
};

export const getCalendarPositions = (date: Date) => {
  const offset = (getFirstDayOfMonth().getDay() + 6) % 7;

  const dayIndex = (date.getDay() + 6) % 7;
  const dateIndex = date.getDate();
  const weekIndex = Math.ceil((dateIndex + offset) / 7) - 1;

  return {
    day: dayIndex,
    week: weekIndex,
  };
};

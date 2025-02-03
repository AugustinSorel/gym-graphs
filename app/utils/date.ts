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

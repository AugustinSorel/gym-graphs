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

export const timeAgo = (from: Date) => {
  const now = new Date();

  const diffInSeconds = Math.round((from.getTime() - now.getTime()) / 1_000);

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const units = [
    { unit: "year", seconds: 31_536_000 },
    { unit: "month", seconds: 2_592_000 },
    { unit: "day", seconds: 86_400 },
    { unit: "hour", seconds: 3_600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ] as const;

  for (const { seconds, unit } of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffInSeconds / seconds), unit);
    }
  }

  return "just now";
};

export const splitTimeAgo = (input: Date) => {
  const str = timeAgo(input).match(/^(\d+)(.*)$/);

  const day = str?.at(1);
  const timeAgoStr = str?.at(2);

  if (!day || !timeAgoStr) {
    throw new Error(`timeAgo fn returned malformed output (${str})`);
  }

  return [day, timeAgoStr] as const;
};

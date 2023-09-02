export const dateAsYearMonthDayFormat = (date: Date) => {
  return date.toLocaleDateString("fr-ca", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const addMonths = (date: Date, months: number) => {
  date.setMonth(date.getMonth() + months);
  return date;
};

export const addDays = (date: Date, days: number) => {
  date.setDate(date.getDate() + days);
  return date;
};

export const addYears = (date: Date, years: number) => {
  date.setFullYear(date.getFullYear() + years);
  return date;
};

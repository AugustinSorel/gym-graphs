export const dateAsYearMonthDayFormat = (date: Date) => {
  return date.toLocaleDateString("en-ZA", {
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

import type { Exercise, ExerciseData } from "@/db/types";
import type { HeatmapData } from "./heatmapGraph";

export const prepareHeatmapData = (
  exercises: (Exercise & { data: ExerciseData[] })[]
) => {
  const res = getDefaultHeatmapData();

  for (const exercise of exercises) {
    for (const data of exercise.data) {
      const day = new Date(data.doneAt)
        .toLocaleDateString("en-en", {
          weekday: "long",
        })
        .toLowerCase();

      const offset = new Date(new Date(data.doneAt).setDate(1)).getDay();

      const weekIndex = Math.ceil(
        (new Date(data.doneAt).getDate() + offset) / 7
      );

      const heatmapColumn = res.find((col) => col.dayIndex === day);

      if (!heatmapColumn) {
        throw new Error(`column not found when preparing heatmap data ${day}`);
      }

      const row = heatmapColumn.bins.find((row) => row.weekIndex === weekIndex);

      if (!row) {
        throw new Error(
          `row not found when preparing heatmap data ${weekIndex}`
        );
      }

      row.count += 1;
    }
  }

  return res;
};

export const getDefaultHeatmapData = (): HeatmapData[] => [
  {
    dayIndex: "monday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "tuesday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "wednesday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "thursday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "friday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "saturday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
  {
    dayIndex: "sunday",
    bins: [
      {
        weekIndex: 5,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
    ],
  },
];

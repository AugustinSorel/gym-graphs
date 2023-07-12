"use client";

import { type ExerciseData } from "@/fakeData";
import { useDimensions } from "@/lib/useDimensions";
import { curveMonotoneX } from "@visx/curve";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath } from "@visx/shape";

export type LineGraphData = Pick<ExerciseData, "oneRepMax" | "date">;

const getDate = (d: LineGraphData) => new Date(d.date);
const getOneRepMax = (d: LineGraphData) => d.oneRepMax;

const DEFAULT_WIDTH = 302;
const DEFAULT_HEIGHT = 253;

export const LineGraph = ({ data }: { data: LineGraphData[] }) => {
  const dimensions = useDimensions(DEFAULT_WIDTH, DEFAULT_HEIGHT);

  const currentMonthData = data.filter((d) => {
    const dataDate = new Date(d.date);
    const currentDate = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return dataDate >= thirtyDaysAgo && dataDate <= currentDate;
  });

  const dateScale = scaleTime({
    range: [0, dimensions.width],
    domain: [
      Math.min(...currentMonthData.map((x) => getDate(x).getTime())),
      Math.max(...currentMonthData.map((x) => getDate(x).getTime())),
    ],
  });

  const oneRepMaxScale = scaleLinear({
    range: [dimensions.height - 1, 1],
    round: true,
    domain: [
      Math.min(...currentMonthData.map(getOneRepMax)),
      Math.max(...currentMonthData.map(getOneRepMax)),
    ],
    nice: true,
  });

  return (
    <svg
      height="100%"
      width="100%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      ref={dimensions.ref}
      className="p-2"
    >
      <LinePath<LineGraphData>
        data={currentMonthData}
        x={(d) => dateScale(getDate(d)) ?? 0}
        y={(d) => oneRepMaxScale(getOneRepMax(d)) ?? 0}
        className="stroke-brand-color-two"
        strokeWidth={2}
        curve={curveMonotoneX}
      />
    </svg>
  );
};

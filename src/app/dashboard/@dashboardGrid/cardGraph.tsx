"use client";

import { type ExerciseData } from "@/fakeData";
import { curveMonotoneX } from "@visx/curve";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { useLayoutEffect, useRef, useState } from "react";

const getDate = (d: ExerciseData) => new Date(d.date);
const getOneRepMax = (d: ExerciseData) => d.oneRepMax;

export const CardGraph = ({ data }: { data: ExerciseData[] }) => {
  const dimensions = useDimension();

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
      ref={dimensions.svgRef}
      className="p-2"
    >
      <LinePath<ExerciseData>
        data={currentMonthData}
        x={(d) => dateScale(getDate(d)) ?? 0}
        y={(d) => oneRepMaxScale(getOneRepMax(d)) ?? 0}
        stroke="hsl(329 82% 65%)"
        strokeWidth={2}
        curve={curveMonotoneX}
      />
    </svg>
  );
};

const useDimension = () => {
  const DEFAULT_WIDTH = 300;
  const DEFAULT_HEIGHT = 250;

  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  useLayoutEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: svgRef.current?.clientWidth ?? DEFAULT_WIDTH,
        height: svgRef.current?.clientHeight ?? DEFAULT_HEIGHT,
      });
    };

    window.addEventListener("resize", updateSize);

    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return {
    svgRef,
    ...dimensions,
  };
};

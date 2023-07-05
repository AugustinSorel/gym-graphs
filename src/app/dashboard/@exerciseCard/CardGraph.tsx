"use client";

import { curveMonotoneX } from "@visx/curve";
import { scaleLinear, scaleTime } from "@visx/scale";
import { LinePath } from "@visx/shape";
import { useLayoutEffect, useRef, useState } from "react";

type Data = [number, number];

const data: Data[] = [
  [new Date(2019, 11, 1).getTime(), 100],
  [new Date(2019, 11, 2).getTime(), 105],
  [new Date(2019, 11, 3).getTime(), 110],
  [new Date(2019, 11, 10).getTime(), 120],
];

const getXValue = (d: Data) => new Date(d[0]);
const getYValue = (d: Data) => d[1];
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 250;

export const CardGraph = () => {
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

  const xScale = scaleTime({
    range: [0, dimensions.width],
    domain: [
      Math.min(...data.map((x) => getXValue(x).getTime())),
      Math.max(...data.map((x) => getXValue(x).getTime())),
    ],
  });

  const yScale = scaleLinear({
    range: [dimensions.height, 0],
    round: true,
    domain: [
      Math.min(...data.map(getYValue)),
      Math.max(...data.map(getYValue)),
    ],
    nice: true,
  });

  return (
    <svg
      height="100%"
      width="100%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      ref={svgRef}
    >
      <LinePath<Data>
        data={data}
        x={(d) => xScale(getXValue(d)) ?? 0}
        y={(d) => yScale(getYValue(d)) ?? 0}
        stroke="hsl(329 82% 65%)"
        strokeWidth={2}
        curve={curveMonotoneX}
      />
    </svg>
  );
};

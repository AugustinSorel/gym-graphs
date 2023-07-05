"use client";

import { curveMonotoneX } from "@visx/curve";
import { scaleLinear, scaleTime } from "@visx/scale";
import { Bar, Line, LinePath } from "@visx/shape";
import { timeFormat } from "d3-time-format";
import {
  MouseEvent,
  TouchEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { bisector } from "d3-array";

type Data = [number, number];

const data: Data[] = [
  [new Date(2019, 11, 1).getTime(), 100],
  [new Date(2019, 11, 2).getTime(), 105],
  [new Date(2019, 11, 3).getTime(), 110],
  [new Date(2019, 11, 10).getTime(), 120],
];

const getXValue = (d: Data) => new Date(d[0]);
const getYValue = (d: Data) => d[1];
const DEFAULT_WIDTH = 1250;
const DEFAULT_HEIGHT = 500;
const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const ExerciseGraph = () => {
  const bisectDate = bisector<Data, Date>(getXValue).left;
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<Data>();

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

  const handleTooltip = (
    event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>
  ) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = xScale.invert(x);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && getXValue(d1)) {
      d =
        x0.valueOf() - getXValue(d0).valueOf() >
        getXValue(d1).valueOf() - x0.valueOf()
          ? d1
          : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: xScale(getXValue(d)),
      tooltipTop: yScale(getYValue(d)),
    });
  };

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
    <>
      <svg
        height="100%"
        width="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        ref={svgRef}
      >
        <g>
          <LinePath<Data>
            data={data}
            x={(d) => xScale(getXValue(d)) ?? 0}
            y={(d) => yScale(getYValue(d)) ?? 0}
            stroke="hsl(329 82% 65%)"
            strokeWidth={2}
            curve={curveMonotoneX}
          />
        </g>

        <g>
          {data.map((d, i) => {
            return (
              <circle
                key={`${getXValue(d).getTime()}-${getYValue(d)}-${i}`}
                cx={xScale(getXValue(d))}
                cy={yScale(getYValue(d))}
                r={3}
                fill="hsl(329 82% 65%)"
              />
            );
          })}
        </g>

        <g>
          <Bar
            width={dimensions.width}
            height={dimensions.height}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
          />
        </g>

        {tooltipData && (
          <g>
            <Line
              from={{ x: tooltipLeft, y: 0 }}
              to={{ x: tooltipLeft, y: dimensions.height }}
              stroke="#59588D"
              strokeWidth={1}
              pointerEvents="none"
              strokeDasharray="5, 5"
              className="transition-all"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={8}
              fill="#FF4DCA"
              fillOpacity={0.5}
              pointerEvents="none"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
              fill="#FF4DCA"
              pointerEvents="none"
            />
          </g>
        )}
      </svg>

      {tooltipData ? (
        <TooltipWithBounds
          top={tooltipTop}
          left={tooltipLeft}
          className="transition-all"
        >
          {`${timeFormat("%b %d %H:%M ")(new Date(getXValue(tooltipData)))}`}:{" "}
          <b>{formatter.format(getYValue(tooltipData))}</b>
        </TooltipWithBounds>
      ) : null}
    </>
  );
};

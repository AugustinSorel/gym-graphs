"use client";

import React, { useRef, useMemo, useCallback } from "react";
import type { TouchEvent, MouseEvent } from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import { Brush } from "@visx/brush";
import type { Bounds } from "@visx/brush/lib/types";
import type BaseBrush from "@visx/brush/lib/BaseBrush";
import { PatternLines } from "@visx/pattern";
import { Group } from "@visx/group";
import type { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
import { AreaClosed, Bar, Line, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { AxisLeft, AxisBottom } from "@visx/axis";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { GridRows } from "@visx/grid";
import { useExercise } from "../exerciseContext";
import type { UseTooltipParams } from "@visx/tooltip/lib/hooks/useTooltip";
import { useDimensions as useDimensionsBase } from "@/hooks/useDimensions";
import { formatDate } from "@/lib/date";
import { ExerciseData } from "@/db/schema";

type GraphPoint = Pick<ExerciseData, "doneAt" | "oneRepMax">;

const getDate = (d: GraphPoint) => new Date(d.doneAt);
const getOneRepMax = (d: GraphPoint) => d.oneRepMax;

const DEFAULT_WIDTH = 1250;
const DEFAULT_HEIGHT = 500;
const margin = { top: 20, left: 40, bottom: 20, right: 20 };
const brushMargin = { top: 10, bottom: 0, left: 10, right: 10 };
const chartSeparation = 30;

export const ExerciseGraph = () => {
  const dimensions = useDimensions();
  const tooltip = useTooltip<GraphPoint>();

  return (
    <>
      <svg
        height="100%"
        width="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        ref={dimensions.ref}
        className="select-none"
      >
        <MainGraph dimensions={dimensions} tooltip={tooltip} />

        <BrushGraph dimensions={dimensions} />
      </svg>

      <Tooltip tooltip={tooltip} />
    </>
  );
};

type Dimensions = ReturnType<typeof useDimensions>;

const useDimensions = () => {
  const dimensions = useDimensionsBase(DEFAULT_WIDTH, DEFAULT_HEIGHT);

  const innerHeight = dimensions.height - margin.top - margin.bottom;
  const topChartBottomMargin = chartSeparation + 10;
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation;

  return {
    bottomChartHeight,
    topChartBottomMargin,
    topChartHeight,
    ...dimensions,
  };
};

const MainGraph = ({
  dimensions,
  tooltip,
}: {
  dimensions: Dimensions;
  tooltip: UseTooltipParams<GraphPoint>;
}) => {
  const xMax = Math.max(dimensions.width - margin.left - margin.right, 0);
  const yMax = Math.max(dimensions.topChartHeight, 0);
  const exercise = useExercise();

  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: [
          Math.min(...exercise.filteredData.map((p) => getDate(p).getTime())),
          Math.max(...exercise.filteredData.map((p) => getDate(p).getTime())),
        ],
      }),
    [xMax, exercise.filteredData]
  );

  const oneRepMaxScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, Math.max(...exercise.filteredData.map(getOneRepMax))],
        nice: true,
      }),
    [yMax, exercise.filteredData]
  );

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      if (exercise.filteredData.length < 1) {
        return;
      }

      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x);
      const index = exercise.data.findIndex(
        (d) => getDate(d).getTime() > x0.getTime()
      );
      const d0 = exercise.data[index - 1] ??
        exercise.data.at(-1) ?? {
          doneAt: new Date().toString(),
          oneRepMax: -1,
        };
      const d1 = exercise.data[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      tooltip.showTooltip({
        tooltipData: d,
        tooltipLeft: dateScale(getDate(d)),
        tooltipTop: oneRepMaxScale(getOneRepMax(d)),
      });
    },
    [
      dateScale,
      tooltip,
      oneRepMaxScale,
      exercise.filteredData.length,
      exercise.data,
    ]
  );

  if (exercise.filteredData.length < 1) {
    return (
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-current text-sm"
      >
        No results.
      </text>
    );
  }

  return (
    <Group left={margin.left} top={margin.top}>
      <LinePath<GraphPoint>
        data={exercise.filteredData}
        x={(d) => dateScale(getDate(d)) || 0}
        y={(d) => oneRepMaxScale(getOneRepMax(d)) || 0}
        className="stroke-brand-color-two"
        strokeWidth={2}
        curve={curveMonotoneX}
      />

      <AreaClosed<GraphPoint>
        data={exercise.filteredData}
        x={(d) => dateScale(getDate(d)) || 0}
        y={(d) => oneRepMaxScale(getOneRepMax(d)) || 0}
        yScale={oneRepMaxScale}
        strokeWidth={1}
        className="fill-brand-color-two/20"
        curve={curveMonotoneX}
      />

      <AxisBottom
        top={yMax}
        scale={dateScale}
        numTicks={dimensions.width > 520 ? 10 : 5}
        tickStroke="gray"
        stroke="gray"
        tickLabelProps={{ textAnchor: "middle" as const, fill: "gray" }}
      />

      <GridRows
        scale={oneRepMaxScale}
        width={xMax}
        stroke="gray"
        numTicks={5}
        opacity={0.2}
      />

      <AxisLeft
        scale={oneRepMaxScale}
        numTicks={5}
        tickStroke="gray"
        stroke="gray"
        tickLabelProps={{
          dx: "-0.25em",
          dy: "0.25em",
          fontFamily: "Arial",
          fontSize: 10,
          textAnchor: "end" as const,
          fill: "gray",
        }}
      />

      <Group>
        {exercise.filteredData.map((d, i) => {
          return (
            <circle
              key={`${getDate(d).getTime()}-${getOneRepMax(d)}-${i}`}
              cx={dateScale(getDate(d))}
              cy={oneRepMaxScale(getOneRepMax(d))}
              r={4}
              className="fill-brand-color-two"
              strokeWidth={2}
            />
          );
        })}
      </Group>

      <Group>
        <Bar
          width={xMax}
          height={yMax}
          fill="transparent"
          onMouseMove={handleTooltip}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseLeave={tooltip.hideTooltip}
        />
      </Group>

      {tooltip.tooltipData ? (
        <Group>
          <Line
            from={{ x: tooltip.tooltipLeft ?? 0, y: 0 }}
            to={{ x: tooltip.tooltipLeft ?? 0, y: yMax }}
            strokeWidth={1}
            pointerEvents="none"
            strokeDasharray="5, 5"
            className="stroke-neutral-500 transition-all"
          />
          <Line
            from={{ x: 0, y: tooltip.tooltipTop ?? 0 }}
            to={{ x: xMax, y: tooltip.tooltipTop ?? 0 }}
            strokeWidth={1}
            pointerEvents="none"
            strokeDasharray="5, 5"
            className="stroke-neutral-500 transition-all"
          />
          <circle
            cx={tooltip.tooltipLeft ?? 0}
            cy={tooltip.tooltipTop ?? 0}
            r={8}
            className="fill-brand-color-two/50"
            pointerEvents="none"
          />
          <circle
            cx={tooltip.tooltipLeft ?? 0}
            cy={tooltip.tooltipTop ?? 0}
            r={4}
            className="fill-brand-color-two"
            pointerEvents="none"
          />
        </Group>
      ) : null}
    </Group>
  );
};

const BrushGraph = ({ dimensions }: { dimensions: Dimensions }) => {
  const exercise = useExercise();
  const brushRef = useRef<BaseBrush | null>(null);

  const xBrushMax = Math.max(
    dimensions.width - brushMargin.left - brushMargin.right,
    0
  );
  const yBrushMax = Math.max(
    dimensions.bottomChartHeight - brushMargin.top - brushMargin.bottom,
    0
  );

  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: [
          Math.min(...exercise.data.map((p) => getDate(p).getTime())),
          Math.max(...exercise.data.map((p) => getDate(p).getTime())),
        ],
      }),
    [xBrushMax, exercise.data]
  );

  const brushOneRepMaxScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, Math.max(...exercise.data.map(getOneRepMax))],
        nice: true,
      }),
    [yBrushMax, exercise.data]
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: {
        x: brushDateScale(
          getDate(
            exercise.filteredData.at(0) ?? {
              doneAt: new Date().toString(),
              oneRepMax: 0,
            }
          )
        ),
      },
      end: {
        x: brushDateScale(
          getDate(
            exercise.filteredData.at(-1) ?? {
              doneAt: new Date().toString(),
              oneRepMax: 0,
            }
          )
        ),
      },
    }),
    [brushDateScale, exercise.filteredData]
  );

  //FIXME:Mobile responsive
  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) {
      return;
    }

    const { x0, x1, y0, y1 } = domain;
    const oneRepMaxCopy = exercise.data.filter((s) => {
      const x = getDate(s).getTime();
      const y = getOneRepMax(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    });

    exercise.setFilteredData(oneRepMaxCopy);
  };

  return (
    <Group
      left={brushMargin.left}
      top={
        dimensions.topChartHeight + dimensions.topChartBottomMargin + margin.top
      }
    >
      <AreaClosed<GraphPoint>
        data={exercise.data}
        x={(d) => brushDateScale(getDate(d)) || 0}
        y={(d) => brushOneRepMaxScale(getOneRepMax(d)) || 0}
        yScale={brushOneRepMaxScale}
        strokeWidth={1}
        className="fill-brand-color-two/20 stroke-brand-color-two"
        curve={curveMonotoneX}
      />

      <PatternLines
        id={"lines"}
        height={8}
        width={8}
        className="stroke-neutral-500"
        strokeWidth={1}
        orientation={["diagonal"]}
      />
      <Brush
        xScale={brushDateScale}
        yScale={brushOneRepMaxScale}
        width={xBrushMax}
        height={yBrushMax}
        margin={brushMargin}
        handleSize={8}
        innerRef={brushRef}
        resizeTriggerAreas={["left", "right"]}
        brushDirection="horizontal"
        initialBrushPosition={initialBrushPosition}
        onChange={onBrushChange}
        onClick={() => exercise.setFilteredData(exercise.data)}
        selectedBoxStyle={{
          fill: "url(#lines)",
          stroke: "gray",
        }}
        useWindowMoveEvents
        renderBrushHandle={(props) => <BrushHandle {...props} />}
      />
    </Group>
  );
};

const BrushHandle = ({ x, height, isBrushActive }: BrushHandleRenderProps) => {
  const pathWidth = 8;
  const pathHeight = 15;

  if (!isBrushActive) {
    return null;
  }
  return (
    <Group left={x + pathWidth / 2} top={(height - pathHeight) / 2}>
      <path
        fill="#f2f2f2"
        d="M -4.5 0.5 L 3.5 0.5 L 3.5 15.5 L -4.5 15.5 L -4.5 0.5 M -1.5 4 L -1.5 12 M 0.5 4 L 0.5 12"
        stroke="#999999"
        strokeWidth="1"
        style={{ cursor: "ew-resize" }}
      />
    </Group>
  );
};

const Tooltip = ({ tooltip }: { tooltip: UseTooltipParams<GraphPoint> }) => {
  if (!tooltip.tooltipData) {
    return null;
  }

  return (
    <TooltipWithBounds
      top={(tooltip.tooltipTop ?? 0) + margin.top}
      left={(tooltip.tooltipLeft ?? 0) + margin.left}
      style={{}}
      className="pointer-events-none absolute rounded-md border border-border bg-popover px-5 py-3 backdrop-blur-md transition-all"
    >
      <p>
        Date: <strong>{formatDate(getDate(tooltip.tooltipData))}</strong>
      </p>
      <p>
        One Rep Max: <strong>{getOneRepMax(tooltip.tooltipData)}</strong>
      </p>
    </TooltipWithBounds>
  );
};

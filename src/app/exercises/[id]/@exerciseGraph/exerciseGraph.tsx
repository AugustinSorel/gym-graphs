"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  type TouchEvent,
  type MouseEvent,
  useCallback,
} from "react";
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
import { TooltipWithBounds, defaultStyles, useTooltip } from "@visx/tooltip";

type Data = {
  date: string;
  close: number;
};

const data: Data[] = [
  { date: "2000/01/01", close: 117.5 },
  { date: "2000/01/02", close: 200 },
  { date: "2000/01/03", close: 150 },
  { date: "2000/01/04", close: 250.5 },
];

const brushMargin = { top: 10, bottom: 15, left: 50, right: 20 };
const chartSeparation = 30;

// accessors
const getDate = (d: Data) => new Date(d.date);
const getData = (d: Data) => d.close;

const DEFAULT_WIDTH = 1250;
const DEFAULT_HEIGHT = 500;
const margin = {
  top: 20,
  left: 50,
  bottom: 20,
  right: 20,
};

export const ExerciseGraph = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const brushRef = useRef<BaseBrush | null>(null);
  const [filteredData, setFilteredStock] = useState(data);

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1, y0, y1 } = domain;
    const stockCopy = data.filter((s) => {
      const x = getDate(s).getTime();
      const y = getData(s);
      return x > x0 && x < x1 && y > y0 && y < y1;
    });
    setFilteredStock(stockCopy);
  };

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<Data>();

  const innerHeight = dimensions.height - margin.top - margin.bottom;
  const topChartBottomMargin = chartSeparation + 10;
  const topChartHeight = 0.8 * innerHeight - topChartBottomMargin;
  const bottomChartHeight = innerHeight - topChartHeight - chartSeparation;

  // bounds
  const xMax = Math.max(dimensions.width - margin.left - margin.right, 0);
  const yMax = Math.max(topChartHeight, 0);
  const xBrushMax = Math.max(
    dimensions.width - brushMargin.left - brushMargin.right,
    0
  );
  const yBrushMax = Math.max(
    bottomChartHeight - brushMargin.top - brushMargin.bottom,
    0
  );

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

  // scales
  const dateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xMax],
        domain: [
          Math.min(...filteredData.map((p) => getDate(p).getTime())),
          Math.max(...filteredData.map((p) => getDate(p).getTime())),
        ],
      }),
    [xMax, filteredData]
  );

  const stockScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, Math.max(...filteredData.map(getData))],
        nice: true,
      }),
    [yMax, filteredData]
  );

  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: [
          Math.min(...data.map((p) => getDate(p).getTime())),
          Math.max(...data.map((p) => getDate(p).getTime())),
        ],
      }),
    [xBrushMax]
  );

  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, Math.max(...data.map(getData))],
        nice: true,
      }),
    [yBrushMax]
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: {
        x: brushDateScale(
          getDate(data[0] ?? { date: new Date().toString(), close: 0 })
        ),
      },
      end: {
        x: brushDateScale(
          getDate(data[2] ?? { date: new Date().toString(), close: 0 })
        ),
      },
    }),
    [brushDateScale]
  );

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = dateScale.invert(x);
      const index = data.findIndex((d) => getDate(d).getTime() > x0.getTime());
      const d0 = data[index - 1] ?? {
        date: new Date().toString(),
        close: 0,
      };
      const d1 = data[index];
      let d = d0;
      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: dateScale(getDate(d)),
        tooltipTop: stockScale(getData(d)),
      });
    },
    [dateScale, showTooltip, stockScale]
  );

  return (
    <>
      <svg
        height="100%"
        width="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        ref={svgRef}
        className="select-none"
      >
        <Group left={margin.left} top={margin.top}>
          <LinePath<Data>
            data={filteredData}
            x={(d) => dateScale(getDate(d)) || 0}
            y={(d) => stockScale(getData(d)) || 0}
            className="stroke-brand-color-two"
            strokeWidth={2}
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
          <AxisLeft
            scale={stockScale}
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
            {data.map((d, i) => {
              return (
                <circle
                  key={`${getDate(d).getTime()}-${getData(d)}-${i}`}
                  cx={dateScale(getDate(d))}
                  cy={stockScale(getData(d))}
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
              onMouseLeave={() => hideTooltip()}
            />
          </Group>

          {tooltipData ? (
            <Group>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5, 5"
                className="stroke-neutral-500 transition-all"
              />
              <Line
                from={{ x: 0, y: tooltipTop }}
                to={{ x: xMax, y: tooltipTop }}
                strokeWidth={1}
                pointerEvents="none"
                strokeDasharray="5, 5"
                className="stroke-neutral-500 transition-all"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={8}
                className="fill-brand-color-two/50"
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={4}
                className="fill-brand-color-two"
                pointerEvents="none"
              />
            </Group>
          ) : null}
        </Group>

        <Group
          left={margin.left}
          top={topChartHeight + topChartBottomMargin + margin.top}
        >
          <AreaClosed<Data>
            data={data}
            x={(d) => brushDateScale(getDate(d)) || 0}
            y={(d) => brushStockScale(getData(d)) || 0}
            yScale={brushStockScale}
            strokeWidth={1}
            className="fill-brand-color-two"
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
            yScale={brushStockScale}
            width={xBrushMax}
            height={yBrushMax}
            margin={brushMargin}
            handleSize={8}
            innerRef={brushRef}
            resizeTriggerAreas={["left", "right"]}
            brushDirection="horizontal"
            initialBrushPosition={initialBrushPosition}
            onChange={onBrushChange}
            onClick={() => setFilteredStock(data)}
            selectedBoxStyle={{
              fill: "url(#lines)",
              stroke: "gray",
            }}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          />
        </Group>
      </svg>

      {tooltipData ? (
        <TooltipWithBounds
          top={tooltipTop + margin.top}
          left={tooltipLeft + margin.left}
          style={{}}
          className="absolute rounded-md border border-border bg-primary px-5 py-1 backdrop-blur-md pointer-events-none transition-all"
        >
          {getData(tooltipData)}
        </TooltipWithBounds>
      ) : null}
    </>
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

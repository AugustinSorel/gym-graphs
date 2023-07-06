"use client";

import React, {
  useRef,
  useState,
  useMemo,
  useLayoutEffect,
  TouchEvent,
  MouseEvent,
} from "react";
import { scaleTime, scaleLinear } from "@visx/scale";
import appleStock, { AppleStock } from "@visx/mock-data/lib/mocks/appleStock";
import { Brush } from "@visx/brush";
import { Bounds } from "@visx/brush/lib/types";
import BaseBrush, {
  BaseBrushState,
  UpdateBrush,
} from "@visx/brush/lib/BaseBrush";
import { PatternLines } from "@visx/pattern";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { max, extent } from "@visx/vendor/d3-array";
import { BrushHandleRenderProps } from "@visx/brush/lib/BrushHandle";
import { ScaleLinear, ScaleTime } from "@visx/vendor/d3-scale";
import { AreaClosed, Bar, Line, LinePath } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { AxisLeft, AxisBottom, AxisScale } from "@visx/axis";
import { localPoint } from "@visx/event";
import { bisector } from "d3-array";
import { TooltipWithBounds, useTooltip } from "@visx/tooltip";

const stock: AppleStock[] = [
  { date: "2000/01/01", close: 117.5 },
  { date: "2000/01/02", close: 200 },
  { date: "2000/01/03", close: 150 },
  { date: "2000/01/04", close: 250.5 },
];

const brushMargin = { top: 10, bottom: 15, left: 50, right: 20 };
const chartSeparation = 30;
const PATTERN_ID = "brush_pattern";
const GRADIENT_ID = "brush_gradient";
export const accentColor = "#f6acc8";
export const background = "#584153";
export const background2 = "#af8baf";
const selectedBrushStyle = {
  fill: `url(#${PATTERN_ID})`,
  stroke: "white",
};

// accessors
const getDate = (d: AppleStock) => new Date(d.date);
const getStockValue = (d: AppleStock) => d.close;
const bisectDate = bisector<AppleStock, Date>(getDate).left;

const DEFAULT_WIDTH = 1250;
const DEFAULT_HEIGHT = 500;
const compact = false;
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
  const [filteredStock, setFilteredStock] = useState(stock);

  const onBrushChange = (domain: Bounds | null) => {
    if (!domain) return;
    const { x0, x1, y0, y1 } = domain;
    const stockCopy = stock.filter((s) => {
      const x = getDate(s).getTime();
      const y = getStockValue(s);
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
  } = useTooltip<AppleStock>();

  const innerHeight = dimensions.height - margin.top - margin.bottom;
  const topChartBottomMargin = compact
    ? chartSeparation / 2
    : chartSeparation + 10;
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
        domain: extent(filteredStock, getDate) as [Date, Date],
      }),
    [xMax, filteredStock]
  );
  const stockScale = useMemo(
    () =>
      scaleLinear<number>({
        range: [yMax, 0],
        domain: [0, max(filteredStock, getStockValue) || 0],
        nice: true,
      }),
    [yMax, filteredStock]
  );
  const brushDateScale = useMemo(
    () =>
      scaleTime<number>({
        range: [0, xBrushMax],
        domain: extent(stock, getDate) as [Date, Date],
      }),
    [xBrushMax]
  );
  const brushStockScale = useMemo(
    () =>
      scaleLinear({
        range: [yBrushMax, 0],
        domain: [0, max(stock, getStockValue) || 0],
        nice: true,
      }),
    [yBrushMax]
  );

  const initialBrushPosition = useMemo(
    () => ({
      start: { x: brushDateScale(getDate(stock[0]!)) },
      end: { x: brushDateScale(getDate(stock[2]!)) },
    }),
    [brushDateScale]
  );

  return (
    <>
      <svg
        height="100%"
        width="100%"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        ref={svgRef}
      >
        <MainGraph
          hideBottomAxis={compact}
          data={filteredStock}
          width={dimensions.width}
          margin={{ ...margin, bottom: topChartBottomMargin }}
          yMax={yMax}
          xScale={dateScale}
          yScale={stockScale}
          gradientColor={background2}
        >
          <Group>
            <Bar
              width={xMax}
              height={yMax}
              fill="transparent"
              onMouseMove={(
                event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>
              ) => {
                const { x } = localPoint(event) || { x: 0 };
                const x0 = dateScale.invert(x);
                const index = bisectDate(stock, x0, 1);
                const d0 = stock[index - 1];
                const d1 = stock[index];
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
                  tooltipTop: stockScale(getStockValue(d)),
                });
              }}
              onMouseLeave={() => hideTooltip()}
            />
          </Group>

          {tooltipData ? (
            <Group>
              <Line
                from={{ x: tooltipLeft, y: 0 }}
                to={{ x: tooltipLeft, y: yMax }}
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
            </Group>
          ) : null}
        </MainGraph>
        <AreaChart
          hideBottomAxis
          hideLeftAxis
          data={stock}
          width={dimensions.width}
          yMax={yBrushMax}
          xScale={brushDateScale}
          yScale={brushStockScale}
          margin={brushMargin}
          top={topChartHeight + topChartBottomMargin + margin.top}
          gradientColor={background2}
        >
          <PatternLines
            id={PATTERN_ID}
            height={8}
            width={8}
            stroke={accentColor}
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
            onClick={() => setFilteredStock(stock)}
            selectedBoxStyle={selectedBrushStyle}
            useWindowMoveEvents
            renderBrushHandle={(props) => <BrushHandle {...props} />}
          />
        </AreaChart>
      </svg>

      {tooltipData ? (
        <TooltipWithBounds
          top={tooltipTop + margin.top}
          left={tooltipLeft + margin.left}
          className="transition-all"
        >
          <b>{getStockValue(tooltipData)}</b>
        </TooltipWithBounds>
      ) : null}
    </>
  );
};

function BrushHandle({ x, height, isBrushActive }: BrushHandleRenderProps) {
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
}

const axisColor = "#fff";
const axisBottomTickLabelProps = {
  textAnchor: "middle" as const,
  fontFamily: "Arial",
  fontSize: 10,
  fill: axisColor,
};
const axisLeftTickLabelProps = {
  dx: "-0.25em",
  dy: "0.25em",
  fontFamily: "Arial",
  fontSize: 10,
  textAnchor: "end" as const,
  fill: axisColor,
};

const AreaChart = ({
  data,
  gradientColor,
  width,
  yMax,
  margin,
  xScale,
  yScale,
  hideBottomAxis = false,
  hideLeftAxis = false,
  top,
  left,
  children,
}: {
  data: AppleStock[];
  gradientColor: string;
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  width: number;
  yMax: number;
  margin: { top: number; right: number; bottom: number; left: number };
  hideBottomAxis?: boolean;
  hideLeftAxis?: boolean;
  top?: number;
  left?: number;
  children?: React.ReactNode;
}) => {
  return (
    <Group left={left || margin.left} top={top || margin.top}>
      <LinearGradient
        id="gradient"
        from={gradientColor}
        fromOpacity={1}
        to={gradientColor}
        toOpacity={0.2}
      />
      <AreaClosed<AppleStock>
        data={data}
        x={(d) => xScale(getDate(d)) || 0}
        y={(d) => yScale(getStockValue(d)) || 0}
        yScale={yScale}
        strokeWidth={1}
        stroke="url(#gradient)"
        fill="url(#gradient)"
        curve={curveMonotoneX}
      />
      {!hideBottomAxis && (
        <AxisBottom
          top={yMax}
          scale={xScale}
          numTicks={width > 520 ? 10 : 5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisBottomTickLabelProps}
        />
      )}
      {!hideLeftAxis && (
        <AxisLeft
          scale={yScale}
          numTicks={5}
          stroke={axisColor}
          tickStroke={axisColor}
          tickLabelProps={axisLeftTickLabelProps}
        />
      )}
      {children}
    </Group>
  );
};

const MainGraph = ({
  data,
  gradientColor,
  width,
  yMax,
  margin,
  xScale,
  yScale,
  hideBottomAxis = false,
  hideLeftAxis = false,
  top,
  left,
  children,
}: {
  data: AppleStock[];
  gradientColor: string;
  xScale: ScaleTime<number, number>;
  yScale: ScaleLinear<number, number>;
  width: number;
  yMax: number;
  margin: { top: number; right: number; bottom: number; left: number };
  hideBottomAxis?: boolean;
  hideLeftAxis?: boolean;
  top?: number;
  left?: number;
  children?: React.ReactNode;
}) => {
  return (
    <>
      <Group left={left || margin.left} top={top || margin.top}>
        <LinePath<AppleStock>
          data={data}
          x={(d) => xScale(getDate(d)) || 0}
          y={(d) => yScale(getStockValue(d)) || 0}
          stroke="#23DBBD"
          strokeWidth={2}
          curve={curveMonotoneX}
        />
        {!hideBottomAxis && (
          <AxisBottom
            top={yMax}
            scale={xScale}
            numTicks={width > 520 ? 10 : 5}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisBottomTickLabelProps}
          />
        )}
        {!hideLeftAxis && (
          <AxisLeft
            scale={yScale}
            numTicks={5}
            stroke={axisColor}
            tickStroke={axisColor}
            tickLabelProps={axisLeftTickLabelProps}
          />
        )}

        <Group>
          {stock.map((d, i) => {
            return (
              <circle
                key={`${getDate(d).getTime()}-${getStockValue(d)}-${i}`}
                cx={xScale(getDate(d))}
                cy={yScale(getStockValue(d))}
                r={4}
                fill="#23DBBD"
                strokeWidth={2}
              />
            );
          })}
        </Group>

        {children}
      </Group>
    </>
  );
};

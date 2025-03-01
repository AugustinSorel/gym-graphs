import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { scaleLinear } from "@visx/scale";
import { Bar, Line, LineRadial } from "@visx/shape";
import { Point } from "@visx/point";
import { max } from "@visx/vendor/d3-array";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { useCallback, useMemo } from "react";
import { localPoint } from "@visx/event";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "~/ui/skeleton";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import type {
  ComponentProps,
  CSSProperties,
  MouseEvent,
  TouchEvent,
} from "react";
import type { selectTilesToSetsCountAction } from "~/dashboard/dashboard.actions";

export const TilesToSetsCountGraph = () => {
  const tilesToSetsCount = useTilesToSetsCount();

  if (!tilesToSetsCount.data.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex overflow-hidden">
      {({ height, width }) => (
        <Graph height={height} width={width} data={tilesToSetsCount.data} />
      )}
    </ParentSize>
  );
};

export const TilesToSetsCountGraphSkeleton = () => {
  const data: GraphProps["data"] = [
    { name: "exercise-1", count: 10 },
    { name: "exercise-2", count: 20 },
    { name: "exercise-3", count: 15 },
    { name: "exercise-4", count: 30 },
    { name: "exercise-5", count: 10 },
  ];

  return (
    <Skeleton className="bg-transparent">
      <ParentSize className="relative flex overflow-hidden">
        {({ height, width }) => (
          <MockGraph height={height} width={width} data={data} />
        )}
      </ParentSize>
    </Skeleton>
  );
};

const Graph = ({ width, height, data }: GraphProps) => {
  const tooltip = useTooltip<GraphPoint>();

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const radius = Math.min(xMax, yMax) / 2;

  const radialScale = useMemo(() => {
    return scaleLinear({
      range: [0, Math.PI * 2],
      domain: [degrees, 0],
    });
  }, []);

  const countScale = useMemo(() => {
    return scaleLinear({
      range: [0, radius],
      domain: [0, max(data, getCount) ?? 0],
    });
  }, [radius, data]);

  const webs = genAngles(data.length);
  const points = genPoints(data.length, radius);
  const polygonPoints = genPolygonPoints(
    data,
    (d) => countScale(d) ?? 0,
    getCount,
  );
  const zeroPoint = new Point({ x: 0, y: 0 });

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);

      if (!point) {
        return;
      }

      const x = point.x - width / 2;
      const y = point.y - (height / 2 - margin.top);

      let angle = Math.atan2(x, y);
      if (angle < 0) {
        angle += 2 * Math.PI;
      }

      const angleDegrees = (angle * 180) / Math.PI;
      const anglePerSection = 360 / data.length;

      const index = Math.floor(
        ((degrees - angleDegrees + anglePerSection / 2) % degrees) /
          anglePerSection,
      );

      const indexReversed = data.length - index - 1;

      const tooltipData = data.at(indexReversed);
      const tooltipPoint = polygonPoints.points.at(indexReversed);

      if (!tooltipData || !tooltipPoint) {
        return;
      }

      tooltip.showTooltip({
        tooltipData: tooltipData,
        tooltipLeft: width / 2 + tooltipPoint.x,
        tooltipTop: height / 2 + tooltipPoint.y - 10,
      });
    },
    [data, tooltip, width, height, polygonPoints.points],
  );

  return (
    <>
      <svg width={width} height={height} className="max-w-full">
        <Group top={height / 2 - margin.top} left={width / 2}>
          {[...new Array<undefined>(levels)].map((_, i) => (
            <LineRadial
              key={`web-${i}`}
              data={webs}
              angle={(d) => radialScale(d.angle) ?? 0}
              radius={((i + 1) * radius) / levels}
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth={2}
              strokeOpacity={0.8}
              strokeLinecap="round"
              suppressHydrationWarning
            />
          ))}

          {[...new Array<undefined>(data.length)].map((_, i) => (
            <Line
              key={`radar-line-${i}`}
              from={zeroPoint}
              to={points[i]}
              stroke="hsl(var(--border))"
              suppressHydrationWarning
            />
          ))}

          <polygon
            points={polygonPoints.pointString}
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            stroke="hsl(var(--primary))"
            strokeWidth={1}
            suppressHydrationWarning
          />

          {polygonPoints.points.map((point, i) => (
            <circle
              key={`radar-point-${i}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill="hsl(var(--primary))"
              suppressHydrationWarning
            />
          ))}
        </Group>

        {/*tooltip circle indicator*/}
        {tooltip.tooltipData && (
          <Group top={margin.top} left={margin.left}>
            <circle
              cx={tooltip.tooltipLeft ?? 0}
              cy={tooltip.tooltipTop ?? 0}
              r={7}
              className="fill-primary"
              pointerEvents="none"
              opacity={0.5}
            />
          </Group>
        )}

        {/*hit zone for tooltip*/}
        <Group top={0} left={0}>
          <Bar
            width={width}
            height={height}
            fill="transparent"
            onMouseMove={handleTooltip}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseLeave={tooltip.hideTooltip}
          />
        </Group>
      </svg>

      {tooltip.tooltipData && (
        <Tooltip
          top={Math.min(tooltip.tooltipTop ?? 0, height - 75)}
          left={Math.min(tooltip.tooltipLeft ?? 0, width - 150)}
          style={tooltipStyles}
        >
          <p className="text-xs font-bold capitalize">
            {tooltip.tooltipData.name}
          </p>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt className="text-muted-foreground before:bg-primary flex items-center before:mr-2 before:block before:size-2">
              frequency
            </dt>
            <dd>{tooltip.tooltipData.count}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const MockGraph = ({ width, height, data }: GraphProps) => {
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const radius = Math.min(xMax, yMax) / 2;

  const radialScale = useMemo(() => {
    return scaleLinear({
      range: [0, Math.PI * 2],
      domain: [degrees, 0],
    });
  }, []);

  const webs = genAngles(data.length);
  const points = genPoints(data.length, radius);
  const zeroPoint = new Point({ x: 0, y: 0 });

  return (
    <svg width={width} height={height} className="max-w-full">
      <Group top={height / 2 - margin.top} left={width / 2}>
        {[...new Array<undefined>(levels)].map((_, i) => (
          <LineRadial
            key={`web-${i}`}
            data={webs}
            angle={(d) => radialScale(d.angle) ?? 0}
            radius={((i + 1) * radius) / levels}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={2}
            strokeOpacity={0.8}
            strokeLinecap="round"
            suppressHydrationWarning
          />
        ))}

        {[...new Array<undefined>(data.length)].map((_, i) => (
          <Line
            key={`radar-line-${i}`}
            from={zeroPoint}
            to={points[i]}
            stroke="hsl(var(--border))"
            suppressHydrationWarning
          />
        ))}
      </Group>
    </svg>
  );
};

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: Readonly<Awaited<ReturnType<typeof selectTilesToSetsCountAction>>>;
}>;

type GraphPoint = Readonly<GraphProps["data"][number]>;

const degrees = 360;
const levels = 5;

const getCount = (d: GraphPoint) => d.count;

const genAngles = (length: number) =>
  [...new Array<undefined>(length + 1)].map((_, i) => ({
    angle:
      i * (degrees / length) + (length % 2 === 0 ? 0 : degrees / length / 2),
  }));

const genPoints = (length: number, radius: number) => {
  const step = (Math.PI * 2) / length;
  return [...new Array<undefined>(length)].map((_, i) => ({
    x: radius * Math.sin(i * step),
    y: radius * Math.cos(i * step),
  }));
};

const genPolygonPoints = <Datum,>(
  dataArray: ReadonlyArray<Datum>,
  scale: (n: number) => number,
  getValue: (d: Datum) => number,
) => {
  const step = (Math.PI * 2) / dataArray.length;
  const points = new Array<{ x: number; y: number }>(dataArray.length).fill({
    x: 0,
    y: 0,
  });
  const pointString = new Array<string>(dataArray.length + 1)
    .fill("")
    .reduce((res, _, i) => {
      if (i > dataArray.length) {
        return res;
      }

      const prev = dataArray.at(i - 1);

      if (!prev) {
        return res;
      }

      const xVal = scale(getValue(prev)) * Math.sin(i * step);
      const yVal = scale(getValue(prev)) * Math.cos(i * step);

      points[i - 1] = { x: xVal, y: yVal };

      res += `${xVal},${yVal} `;

      return res;
    });

  return { points, pointString };
};

const margin = {
  top: 5,
  left: 0,
  right: 0,
  bottom: 20,
} as const;

const tooltipStyles: Readonly<CSSProperties> = {
  ...defaultStyles,
  borderRadius: "0.5rem",
  border: "1px solid hsl(var(--border))",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
  color: "hsl(var(--foreground))",
  transition: "all 0.1s ease-in-out",
  backgroundColor: "hsl(var(--secondary))",
};

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

const useTilesToSetsCount = () => {
  return useSuspenseQuery(dashboardQueries.tilesToSetsCount);
};

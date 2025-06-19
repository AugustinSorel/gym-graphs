import { Bar, LinePath } from "@visx/shape";
import { ParentSize } from "@visx/responsive";
import { curveMonotoneX } from "@visx/curve";
import { scaleLinear } from "@visx/scale";
import { max } from "@visx/vendor/d3-array";
import { calculateOneRepMax } from "~/set/set.utils";
import { Group } from "@visx/group";
import { localPoint } from "@visx/event";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { useCallback, useMemo } from "react";
import { useUser } from "~/user/hooks/use-user";
import { oneRepMaxAlgoEnum } from "~/db/db.schemas";
import type { CSSProperties, MouseEvent, TouchEvent } from "react";

export const OneRepMaxAlgorithmsGraph = () => {
  return (
    <ParentSize className="relative flex min-h-[300px] max-w-full">
      {({ height, width }) => <Graph height={height} width={width} />}
    </ParentSize>
  );
};

const Graph = ({ height, width }: GraphProps) => {
  const user = useUser();
  const tooltip = useTooltip<TooltipData>();

  const xScale = useMemo(() => {
    return scaleLinear({
      domain: [0, maxX],
      range: [0, width],
    });
  }, [width]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, maxY],
      range: [height, 0],
    });
  }, [height]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x, y } = localPoint(event) ?? { x: 0, y: 0 };

      const xValue = xScale.invert(x);
      const index = Math.round(xValue);
      const minDistanceThreshold = 50;

      const { closestLine, minDistance } = algoLines.reduce(
        (acc, curr) => {
          const line = curr.data.at(index);

          if (!line) {
            return acc;
          }

          const lineY = yScale(line.y);
          const distance = Math.abs(lineY - y);

          if (distance < acc.minDistance) {
            return {
              closestLine: curr,
              minDistance: distance,
            };
          }

          return acc;
        },
        {
          closestLine: algoLines.at(0),
          minDistance: Infinity,
        },
      );

      if (minDistance > minDistanceThreshold) {
        tooltip.hideTooltip();
        return;
      }

      tooltip.showTooltip({
        tooltipData: closestLine,
        tooltipLeft: x,
        tooltipTop: y,
      });
    },
    [tooltip, xScale, yScale],
  );
  return (
    <>
      <svg width={width} height={height}>
        {algoLines.map((algoLine) => (
          <LinePath<Point>
            key={algoLine.name}
            curve={curveMonotoneX}
            data={algoLine.data}
            x={(d) => xScale(getX(d))}
            y={(d) => yScale(getY(d))}
            className="stroke-primary"
            strokeWidth={user.data.oneRepMaxAlgo === algoLine.name ? 3 : 1}
            opacity={user.data.oneRepMaxAlgo === algoLine.name ? 1 : 0.5}
            shapeRendering="geometricPrecision"
          />
        ))}

        {/*tooltip line indicator*/}
        {tooltip.tooltipData && (
          <Group top={0} left={0}>
            <LinePath<Point>
              curve={curveMonotoneX}
              data={
                algoLines.find((d) => d.name === tooltip.tooltipData?.name)
                  ?.data ?? []
              }
              x={(d) => xScale(getX(d))}
              y={(d) => yScale(getY(d))}
              className="stroke-primary"
              strokeWidth={3}
              opacity={0.5}
              shapeRendering="geometricPrecision"
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
          <p className="text-xs font-bold capitalize">algorithm</p>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[auto_1fr_auto] items-center gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt className="text-muted-foreground before:bg-primary flex items-center before:mr-2 before:block before:size-2">
              algorithm
            </dt>
            <dd>{tooltip.tooltipData.name}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

type GraphProps = Readonly<{
  height: number;
  width: number;
}>;

type Point = Readonly<{
  x: number;
  y: number;
}>;

type TooltipData = Readonly<Pick<(typeof algoLines)[number], "name">>;

const mockPoints = [
  {
    repetitions: 1,
    weight: 1,
  },
  {
    repetitions: 5,
    weight: 5,
  },
  {
    repetitions: 10,
    weight: 10,
  },
  {
    repetitions: 15,
    weight: 15,
  },
  {
    repetitions: 20,
    weight: 20,
  },
  {
    repetitions: 25,
    weight: 25,
  },
];

const getX = (point: Point) => point.x;
const getY = (point: Point) => point.y;

const algoLines = oneRepMaxAlgoEnum.enumValues.map((algo) => ({
  name: algo,
  data: mockPoints.map((point, i) => ({
    x: i,
    y: calculateOneRepMax(point.weight, point.repetitions, algo),
  })),
}));

const maxX =
  max(
    algoLines.flatMap((x) => x.data),
    getX,
  ) ?? 0;

const maxY =
  max(
    algoLines.flatMap((x) => x.data),
    getY,
  ) ?? 0;

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

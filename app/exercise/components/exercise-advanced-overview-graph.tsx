import { bisector, extent, max } from "@visx/vendor/d3-array";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { LinePath, AreaClosed, Bar } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { AxisBottom } from "@visx/axis";
import { Group } from "@visx/group";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { LinearGradient } from "@visx/gradient";
import { localPoint } from "@visx/event";
import { useCallback, useMemo } from "react";
import type { CSSProperties, MouseEvent, TouchEvent } from "react";
import { z } from "zod";
import type { Set } from "~/db/db.schemas";
import { getOneRepMaxEplay } from "~/set/set.utils";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { WeightValue } from "~/weight-unit/components/weight-value";

export const ExerciseAdvanceOverviewGraph = (props: Props) => {
  const sets = useMemo(() => {
    return props.sets.toSorted(
      (a, b) => a.doneAt.getTime() - b.doneAt.getTime(),
    );
  }, [props.sets]);

  return (
    <ParentSize className="relative flex min-h-[400px] sm:min-h-[500px]">
      {({ height, width }) => (
        <Graph height={height} width={width} sets={sets} />
      )}
    </ParentSize>
  );
};

const Graph = ({ height, width, sets }: GraphProps) => {
  const tooltip = useTooltip<Point>();

  const timeScale = useMemo(() => {
    return scaleTime({
      domain: extent(sets, getDoneAt) as [Date, Date],
      range: [0, width - margin.right - margin.left],
    });
  }, [margin, width, sets]);

  const oneRepMaxScale = useMemo(() => {
    return scaleLinear({
      domain: [0, max(sets, getOneRepMax) ?? 0],
      range: [height - margin.top - margin.bottom, 0],
    });
  }, [margin, height, sets]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) ?? { x: 0 };
      const x0 = timeScale.invert(x - margin.right);
      const index = bisectDate(sets, x0, 1);

      const d0 = sets.at(index - 1) ?? {
        doneAt: new Date(),
        repetitions: 0,
        weightInKg: 0,
      };

      const d1 = sets.at(index);

      let d = d0;

      if (d1 && getDoneAt(d1)) {
        d =
          x0.valueOf() - getDoneAt(d0).valueOf() >
          getDoneAt(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }

      tooltip.showTooltip({
        tooltipData: d,
        tooltipLeft: timeScale(getDoneAt(d)),
        tooltipTop: oneRepMaxScale(getOneRepMax(d)),
      });
    },
    [tooltip, oneRepMaxScale, timeScale],
  );

  if (!sets.length) {
    return <p className="m-auto text-muted-foreground">no sets</p>;
  }

  return (
    <>
      <svg width={width} height={height} className="max-w-full">
        {/*bottom axis*/}
        <Group top={margin.top} left={margin.left}>
          <AxisBottom
            top={height - margin.top - margin.bottom}
            scale={timeScale}
            numTicks={5}
            tickFormat={(value) => {
              const date = z
                .number()
                .transform((d) => new Date(d))
                .or(z.date())
                .catch(new Date())
                .parse(value);

              return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }}
            tickLabelProps={(_value, index) => ({
              className:
                "fill-muted-foreground text-xs data-[first=true]:translate-x-2 data-[last=true]:-translate-x-10",
              "data-first": index === 0,
              "data-last": index === sets.length - 1 && width > 500,
            })}
            hideTicks
            axisLineClassName="stroke-muted"
          />
        </Group>

        {/*background horizontal line*/}
        <Group top={margin.top} left={margin.left}>
          <GridRows
            scale={oneRepMaxScale}
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            stroke="hsl(var(--border))"
            numTicks={4}
          />
        </Group>

        {/*line graph + the gradient underneath*/}
        <Group top={margin.top} left={margin.left}>
          <LinearGradient
            id="area-gradient"
            from="hsl(var(--primary))"
            to="hsl(var(--primary))"
            toOpacity={0.2}
            fromOpacity={0.8}
          />

          <AreaClosed<Point>
            data={sets}
            x={(d) => timeScale(getDoneAt(d))}
            y={(d) => oneRepMaxScale(getOneRepMax(d))}
            yScale={oneRepMaxScale}
            strokeWidth={0}
            stroke="url(#area-gradient)"
            fill="url(#area-gradient)"
            curve={curveMonotoneX}
          />

          <LinePath<Point>
            curve={curveMonotoneX}
            data={sets}
            x={(d) => timeScale(getDoneAt(d))}
            y={(d) => oneRepMaxScale(getOneRepMax(d))}
            className="stroke-primary"
            strokeWidth={2}
            shapeRendering="geometricPrecision"
          />
        </Group>

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

        {/*tooltip circle indicator*/}
        {tooltip.tooltipData && (
          <Group top={margin.top} left={margin.left}>
            <circle
              cx={tooltip.tooltipLeft ?? 0}
              cy={tooltip.tooltipTop ?? 0}
              r={6}
              className="fill-primary"
              pointerEvents="none"
            />
          </Group>
        )}
      </svg>

      {tooltip.tooltipData && (
        <Tooltip
          top={(tooltip.tooltipTop ?? 0) - tooltipMargin.top}
          left={Math.min(
            Math.max((tooltip.tooltipLeft ?? 0) - tooltipMargin.left, 0),
            width - 125,
          )}
          style={tooltipStyles}
        >
          <time
            dateTime={tooltip.tooltipData.doneAt.toString()}
            className="text-xs font-bold"
          >
            {tooltip.tooltipData.doneAt.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>

          <dl className="grid grid-cols-[1fr_auto] gap-x-2 whitespace-nowrap text-xs [&>dd]:ml-auto [&>dd]:font-semibold [&>dt]:text-muted-foreground">
            <dt>1 rep max</dt>
            <dd>
              <WeightValue
                weightInKg={getOneRepMaxEplay(
                  tooltip.tooltipData.weightInKg,
                  tooltip.tooltipData.repetitions,
                )}
              />{" "}
              <WeightUnit />
            </dd>
            <dt>weight</dt>
            <dd>
              <WeightValue weightInKg={tooltip.tooltipData.weightInKg} />{" "}
              <WeightUnit />
            </dd>
            <dt>repetitions</dt>
            <dd>{tooltip.tooltipData.repetitions}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const getDoneAt = (d: Point) => d.doneAt;
const getOneRepMax = (d: Point) =>
  getOneRepMaxEplay(d.weightInKg, d.repetitions);
const bisectDate = bisector<Point, Date>((d) => new Date(d.doneAt)).left;

const margin = {
  top: 30,
  bottom: 30,
  left: 10,
  right: 10,
} as const;

const tooltipMargin = {
  top: 100,
  bottom: 0,
  left: 35,
  right: 0,
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

type Point = Readonly<Pick<Set, "weightInKg" | "repetitions" | "doneAt">>;

type Props = Readonly<{
  sets: Array<Point>;
}>;

type GraphProps = {
  height: number;
  width: number;
} & Pick<Props, "sets">;

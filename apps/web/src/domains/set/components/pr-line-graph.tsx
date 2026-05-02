import { bisector, extent, max } from "@visx/vendor/d3-array";
import { AreaClosed, Bar, LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { useProgressivePrs } from "~/domains/set/hooks/use-progressive-prs";
import type { Set } from "@gym-graphs/shared/set/schemas";
import {
  CSSProperties,
  MouseEvent,
  TouchEvent,
  useCallback,
  type ComponentProps,
} from "react";
import { User } from "@gym-graphs/shared/user/schemas";
import { Mutable } from "effect/Types";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { WeightValue } from "~/domains/user/components/weight-value";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { Group } from "@visx/group";

export const PrLineGraph = ({ sets }: Props) => {
  const prs = useProgressivePrs(sets);

  if (!prs.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex min-h-full">
      {({ width, height }) => <Graph width={width} height={height} prs={prs} />}
    </ParentSize>
  );
};

const Graph = ({ width, height, prs }: GraphProps) => {
  const user = useSuspenseQuery(userQueries.get);
  const tooltip = useTooltip<Point>();
  const lastPr = prs.at(-1);

  const timeScale = scaleTime({
    domain: extent(prs, getDoneAt) as [Date, Date],
    range: [0, width],
  });

  const oneRepMaxScale = scaleLinear({
    domain: [0, max(prs, (d) => getOneRepMax(d, user.data.oneRepMaxAlgo)) ?? 0],
    range: [height - margin.top, margin.bottom],
  });

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) ?? { x: 0 };
      const x0 = timeScale.invert(x - margin.right);
      const index = bisectDate(prs, x0, 1);

      const d0: Point = prs.at(index - 1) ?? {
        doneAt: new Date(),
        repetitions: 0,
        weightInMg: 0,
      };

      const d1 = prs.at(index);

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
        tooltipTop: oneRepMaxScale(getOneRepMax(d, user.data.oneRepMaxAlgo)),
      });
    },
    [tooltip, timeScale, prs, user.data.oneRepMaxAlgo, oneRepMaxScale],
  );

  return (
    <>
      <svg
        width={width}
        height={height}
        className="max-w-full overflow-visible"
      >
        <LinePath<Point>
          curve={curveMonotoneX}
          data={prs as Mutable<typeof prs>}
          x={(d) => timeScale(getDoneAt(d))}
          y={(d) => oneRepMaxScale(getOneRepMax(d, user.data.oneRepMaxAlgo))}
          className="stroke-primary"
          strokeWidth={2}
          shapeRendering="geometricPrecision"
        />

        <LinearGradient
          id="pr-area-gradient"
          from="#4055bf"
          to="#4055bf"
          fromOpacity={0.3}
          toOpacity={0}
        />

        <AreaClosed<Point>
          data={prs as Mutable<typeof prs>}
          x={(d) => timeScale(getDoneAt(d))}
          y={(d) => oneRepMaxScale(getOneRepMax(d, user.data.oneRepMaxAlgo))}
          yScale={oneRepMaxScale}
          fill="url(#pr-area-gradient)"
          curve={curveMonotoneX}
        />

        {/*end of line dot*/}
        {lastPr && (
          <circle
            cx={timeScale(getDoneAt(lastPr))}
            cy={oneRepMaxScale(getOneRepMax(lastPr, user.data.oneRepMaxAlgo))}
            r={4}
            className="fill-primary"
            stroke="white"
            strokeWidth={2}
            pointerEvents="none"
          />
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

        {/*tooltip circle indicator*/}
        {tooltip.tooltipData && (
          <Group top={0} left={0}>
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
            width - 150,
          )}
          style={tooltipStyles}
        >
          <time
            dateTime={tooltip.tooltipData.doneAt.toString()}
            className="text-xs font-bold"
          >
            {new Date(tooltip.tooltipData.doneAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>

          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt>1 rep max</dt>
            <dd>
              <WeightValue
                weightInMg={calculateOneRepMax(
                  tooltip.tooltipData.weightInMg,
                  tooltip.tooltipData.repetitions,
                  user.data.oneRepMaxAlgo,
                )}
              />{" "}
              <WeightUnit />
            </dd>
            <dt>weight</dt>
            <dd>
              <WeightValue weightInMg={tooltip.tooltipData.weightInMg} />{" "}
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

const getOneRepMax = (d: Point, algo: User["oneRepMaxAlgo"]) => {
  return calculateOneRepMax(d.weightInMg, d.repetitions, algo);
};

const margin = { top: 20, bottom: 20, left: 0, right: 0 } as const;

type Point = Pick<Set, "weightInMg" | "repetitions" | "doneAt">;

type Props = Readonly<{ sets: ReadonlyArray<Set> }>;

type GraphProps = Readonly<{
  width: number;
  height: number;
  prs: ReadonlyArray<Set>;
}>;

const NoDataText = (props: ComponentProps<"p">) => (
  <p className="text-muted-foreground m-auto text-sm" {...props} />
);

const bisectDate = bisector<Point, Date>((d) => new Date(d.doneAt)).left;

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

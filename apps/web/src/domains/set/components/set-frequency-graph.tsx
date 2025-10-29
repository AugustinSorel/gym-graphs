import { bisector, extent, max } from "@visx/vendor/d3-array";
import { GridRows, GridColumns } from "@visx/grid";
import { Bar, Circle, Line } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { AxisBottom } from "@visx/axis";
import { Group } from "@visx/group";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { Fragment, useCallback, useMemo } from "react";
import { z } from "zod";
import { WeightUnit } from "~/domains/user/components/weight-unit";
import { WeightValue } from "~/domains/user/components/weight-value";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useUser } from "~/domains/user/hooks/use-user";
import { dateAsYYYYMMDD } from "~/utils/date";
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "@gym-graphs/api";
import type {
  ComponentProps,
  CSSProperties,
  MouseEvent,
  TouchEvent,
} from "react";
import type { Serialize } from "~/utils/json";

export const SetFrequencyGraph = (props: Props) => {
  const sets = useSets(props.sets);
  const noSets = !sets.length;

  if (noSets) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex min-h-[400px] sm:min-h-[500px]">
      {({ height, width }) => (
        <Graph height={height} width={width} sets={sets} />
      )}
    </ParentSize>
  );
};

const Graph = ({ height, width, sets }: GraphProps) => {
  const tooltip = useTooltip<string>();
  const user = useUser();
  const setsByDoneAt = useSetsByDoneAt(sets);

  const timeScale = useMemo(() => {
    return scaleTime({
      domain: extent(sets, getDoneAt) as [Date, Date],
      range: [0, width - margin.right - margin.left],
    });
  }, [width, sets]);

  const oneRepMaxScale = useMemo(() => {
    return scaleLinear({
      domain: [
        0,
        max(sets, (d) => getOneRepMax(d, user.data.oneRepMaxAlgo)) ?? 0,
      ],
      range: [height - margin.top - margin.bottom, 0],
    });
  }, [height, sets, user.data.oneRepMaxAlgo]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) ?? { x: 0 };
      const x0 = timeScale.invert(x - margin.right);
      const index = bisectDate(sets, x0, 1);

      const d0: Point = sets.at(index - 1) ?? {
        id: -1,
        doneAt: new Date().toString(),
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

      const key = dateAsYYYYMMDD(new Date(d.doneAt));

      const z = setsByDoneAt.get(key)?.at(0) ?? {
        id: -1,
        doneAt: new Date().toString(),
        repetitions: 0,
        weightInKg: 0,
      };

      tooltip.showTooltip({
        tooltipData: key,
        tooltipLeft: timeScale(getDoneAt(z)),
        tooltipTop: oneRepMaxScale(getOneRepMax(z, user.data.oneRepMaxAlgo)),
      });
    },
    [
      tooltip,
      timeScale,
      sets,
      user.data.oneRepMaxAlgo,
      oneRepMaxScale,
      setsByDoneAt,
    ],
  );

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

        {/*background lines*/}
        <Group top={margin.top} left={margin.left}>
          <GridRows
            scale={oneRepMaxScale}
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            numTicks={10}
          />

          <GridColumns
            scale={timeScale}
            width={width - margin.left - margin.right}
            height={height - margin.top - margin.bottom}
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            numTicks={10}
          />
        </Group>

        {/*circles*/}
        <Group top={margin.top} left={margin.left}>
          {sets.map((set) => (
            <Circle
              key={set.id}
              r={4}
              cx={timeScale(getDoneAt(set))}
              cy={oneRepMaxScale(getOneRepMax(set, user.data.oneRepMaxAlgo))}
              className="fill-primary"
            />
          ))}
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

        {tooltip.tooltipData && (
          <Group top={margin.top} left={margin.left}>
            <Line
              from={{ x: tooltip.tooltipLeft ?? 0, y: 0 }}
              to={{ x: tooltip.tooltipLeft ?? 0, y: innerHeight }}
              className="stroke-primary/50"
              strokeWidth={2}
              pointerEvents="none"
              strokeDasharray="5,2"
            />
          </Group>
        )}

        {/*tooltip circle indicator*/}
        {tooltip.tooltipData && (
          <Group top={margin.top} left={margin.left}>
            {setsByDoneAt
              .get(tooltip.tooltipData)
              ?.map((set) => (
                <Circle
                  key={set.id}
                  r={8}
                  cx={timeScale(getDoneAt(set))}
                  cy={oneRepMaxScale(
                    getOneRepMax(set, user.data.oneRepMaxAlgo),
                  )}
                  className="fill-primary/50"
                  pointerEvents="none"
                />
              ))}
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
            dateTime={new Date(tooltip.tooltipData).toString()}
            className="text-xs font-bold"
          >
            {new Date(tooltip.tooltipData).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>

          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            {setsByDoneAt.get(tooltip.tooltipData)?.map((set, i) => (
              <Fragment key={set.id}>
                <dt>set {i + 1}</dt>
                <dd>
                  <WeightValue
                    weightInKg={calculateOneRepMax(
                      set.weightInKg,
                      set.repetitions,
                      user.data.oneRepMaxAlgo,
                    )}
                  />{" "}
                  <WeightUnit />
                </dd>
              </Fragment>
            ))}
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const getDoneAt = (d: Point) => new Date(new Date(d.doneAt).toDateString());
const getOneRepMax = (
  d: Point,
  algo: Parameters<typeof calculateOneRepMax>[2],
) => calculateOneRepMax(d.weightInKg, d.repetitions, algo);
const bisectDate = bisector<Point, Date>((d) => new Date(d.doneAt)).left;

const margin = {
  top: 30,
  bottom: 30,
  left: 10,
  right: 10,
} as const;

const tooltipMargin = {
  top: 50,
  bottom: 0,
  left: -10,
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

type Point = Readonly<
  Pick<Serialize<Set>, "weightInKg" | "repetitions" | "doneAt" | "id">
>;

type Props = Readonly<{
  sets: Array<Point>;
}>;

type GraphProps = Readonly<
  {
    height: number;
    width: number;
  } & Pick<Props, "sets">
>;

const NoDataText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-muted-foreground flex min-h-[400px] items-center justify-center text-sm sm:min-h-[500px]"
      {...props}
    />
  );
};

const useSets = (sets: GraphProps["sets"]) => {
  const sortedSets = useSortSetsByDoneAt(sets);

  return useMemo(() => sortedSets, [sortedSets]);
};

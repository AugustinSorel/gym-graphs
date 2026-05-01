import { max } from "@visx/vendor/d3-array";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { AxisLeft } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import {
  useCallback,
  useMemo,
  type CSSProperties,
  type MouseEvent,
  type TouchEvent,
} from "react";
import type { ComponentProps } from "react";
import type { Set } from "@gym-graphs/shared/set/schemas";

type Props = Readonly<{ sets: ReadonlyArray<Set> }>;
import { useSetsByDoneAt } from "~/domains/set/hooks/use-sets-by-done-at";
import { useSortSetsByDoneAt } from "~/domains/set/hooks/use-sort-sets-by-done-at";
import { accumulateVolumeInSets } from "~/domains/set/set.utils";

export const VolumePerSessionGraph = ({ sets }: Props) => {
  const sorted = useSortSetsByDoneAt(sets);
  const setsByDate = useSetsByDoneAt(sorted);

  const sessions = useMemo<Session[]>(
    () =>
      Array.from(setsByDate.entries())
        .map(([date, dateSets]) => ({
          date,
          volume: accumulateVolumeInSets(dateSets as Set[]),
        }))
        .slice(-15),
    [setsByDate],
  );

  if (!sessions.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="overflow-hidden">
      {({ width, height }) => (
        <Graph width={width} height={height} sessions={sessions} />
      )}
    </ParentSize>
  );
};

const Graph = ({ width, height, sessions }: GraphProps) => {
  const tooltip = useTooltip<Session>();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = scaleBand({
    domain: sessions.map((s) => s.date),
    range: [0, innerWidth],
    padding: 0.25,
  });

  const yScale = scaleLinear({
    domain: [0, max(sessions, (s) => s.volume) ?? 0],
    range: [innerHeight, 0],
  });

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) ?? { x: 0, y: 0 };

      const innerX = x - margin.left;
      const index = Math.floor(innerX / xScale.step());
      const session = sessions[index];

      if (!session) return;

      tooltip.showTooltip({
        tooltipData: session,
        tooltipLeft: xScale(getDoneAt(session)) ?? 0,
        tooltipTop: yScale(getVolume(session)) ?? 0,
      });
    },
    [tooltip, xScale, sessions],
  );

  return (
    <>
      <svg
        width={width}
        height={height}
        className="max-w-full overflow-visible"
      >
        <Group top={margin.top} left={margin.left}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            height={innerHeight}
            stroke="hsl(var(--border))"
            strokeOpacity={0.5}
            numTicks={3}
          />

          <AxisLeft
            scale={yScale}
            numTicks={3}
            tickFormat={(v) => `${(Number(v) / 1000000).toFixed(0)}k`}
            tickLabelProps={{
              className: "fill-muted-foreground text-xs",
              textAnchor: "end",
              dx: "-0.25em",
              dy: "0.33em",
            }}
            hideTicks
            hideAxisLine
          />

          {sessions.map((session) => {
            const bandX = xScale(session.date) ?? 0;
            const barX = bandX + (xScale.bandwidth() - barWidth) / 2;
            const barY = yScale(session.volume);
            const barHeight = innerHeight - barY;
            const isHovered = tooltip.tooltipData?.date === session.date;

            return (
              <Group key={session.date}>
                {/* rounded top bar using path */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  className={isHovered ? "fill-primary/70" : "fill-primary/90"}
                  style={{ transition: "fill 0.15s ease" }}
                />
              </Group>
            );
          })}
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
      </svg>

      {tooltip.tooltipData && (
        <Tooltip
          top={(tooltip.tooltipTop ?? 0) - 25}
          left={Math.min(tooltip.tooltipLeft ?? 0, width - 150)}
          style={tooltipStyles}
        >
          <time
            dateTime={tooltip.tooltipData.date}
            className="text-xs font-bold"
          >
            {new Date(tooltip.tooltipData.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </time>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt>volume</dt>
            <dd>{(tooltip.tooltipData.volume / 1000).toLocaleString()} kg</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const getDoneAt = (d: Session) => d.date;

const getVolume = (d: Session) => d.volume;

const barWidth = 8;

const margin = { top: 8, bottom: 8, left: 42, right: 4 } as const;

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

type Session = Readonly<{ date: string; volume: number }>;

type GraphProps = Readonly<{
  width: number;
  height: number;
  sessions: Array<Session>;
}>;

const NoDataText = (props: ComponentProps<"p">) => (
  <p className="text-muted-foreground m-auto text-sm" {...props} />
);

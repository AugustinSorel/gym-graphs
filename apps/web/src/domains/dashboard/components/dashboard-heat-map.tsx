import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useCallback, useMemo } from "react";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { Skeleton } from "~/ui/skeleton";
import { getCalendarPositions, getFirstDayOfMonth } from "~/utils/date";
import { Bar } from "@visx/shape";
import { cn } from "~/styles/styles.utils";
import { useTiles } from "~/domains/tile/hooks/use-tiles";
import type {
  ComponentProps,
  CSSProperties,
  MouseEvent,
  TouchEvent,
} from "react";
import type { Set } from "@gym-graphs/api";
import type { Serialize } from "~/utils/json";

export const DashboardHeatMap = () => {
  const data = useDashboardHeatMap();

  const heatMapEmpty = data.flatMap((d) => d.bins).every((e) => !e.count);

  if (heatMapEmpty) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex overflow-hidden">
      {({ height, width }) => (
        <Graph height={height} width={width} data={data} />
      )}
    </ParentSize>
  );
};

const Graph = ({ width, height, data }: GraphProps) => {
  const tooltip = useTooltip<TooltipData>();

  const binSize = 30;
  const gap = 5;
  const xMax = 7 * binSize + 7 * gap;
  const yMax = 6 * binSize + 6 * gap;
  const centerX = width / 2 - xMax / 2;

  const xScale = useMemo(() => {
    return scaleLinear({
      domain: [0, data.length],
      range: [0, xMax],
    });
  }, [data.length, xMax]);

  const yScale = useMemo(() => {
    return scaleLinear({
      domain: [0, max(data, (d) => getBins(d).length)],
      range: [yMax, 0],
    });
  }, [yMax, data]);

  const opacityScale = useMemo(() => {
    return scaleLinear({
      range: [0.1, 1],
      domain: [0, max(data, (d) => max(getBins(d), getCount))],
    });
  }, [data]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);

      if (!point) {
        return;
      }

      const x = Math.min(Math.max(point.x - 45, 0), 235);
      const y = Math.min(Math.max(point.y - 7, 0), 200);

      const binHitSize = binSize + gap;

      const weekIndex = Math.floor(y / binHitSize) as Bin["weekIndex"];
      const dayIndex = Math.floor(x / binHitSize) as Bins["dayIndex"];

      const row = data.find((day) => day.dayIndex === dayIndex);

      if (!row) {
        return;
      }

      const bin = row.bins.find((week) => week.weekIndex === weekIndex);

      if (!bin) {
        return;
      }

      const tooltipX = (dayIndex + (1 * dayIndex > 3 ? -2 : 2)) * binHitSize;
      const tooltipY = (weekIndex + (1 * weekIndex > 2 ? -1 : 1)) * binHitSize;

      tooltip.showTooltip({
        tooltipData: {
          dayIndex,
          weekIndex,
          count: bin.count,
        },
        tooltipLeft: tooltipX,
        tooltipTop: tooltipY,
      });
    },
    [data, tooltip],
  );

  return (
    <>
      <svg width={width} height={height}>
        <Group top={margin.top} left={centerX}>
          <HeatmapRect<Bins, Bin>
            data={data}
            xScale={(d) => xScale(d) ?? 0}
            yScale={(d) => yScale(d) ?? 0}
            opacityScale={opacityScale}
            binWidth={binSize}
            binHeight={binSize}
            gap={gap}
          >
            {(heatmap) => {
              return heatmap.map((heatmapBins) => {
                return heatmapBins.map((bin) => {
                  const isHovered =
                    tooltip.tooltipData?.weekIndex === bin.bin.weekIndex &&
                    tooltip.tooltipData?.dayIndex === bin.datum.dayIndex;

                  return (
                    <rect
                      key={`heatmap-rect-${bin.row}-${bin.column}`}
                      width={bin.width}
                      height={bin.height}
                      className={cn(
                        "stroke-primary/30 transition-colors",
                        isHovered && "stroke-primary",
                      )}
                      style={{
                        fill: `hsl(var(--primary)/${(bin.opacity ?? 100) / 2})`,
                      }}
                      x={bin.x}
                      y={bin.y}
                    />
                  );
                });
              });
            }}
          </HeatmapRect>
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
          top={Math.min(tooltip.tooltipTop ?? 0, height - 75)}
          left={Math.min(tooltip.tooltipLeft ?? 0, width - 140)}
          style={tooltipStyles}
        >
          <p className="white text-xs font-bold whitespace-nowrap capitalize">
            {new Date(
              new Date().setDate(
                tooltip.tooltipData.dayIndex +
                  1 +
                  tooltip.tooltipData.weekIndex * 7 -
                  ((getFirstDayOfMonth().getDay() + 6) % 7),
              ),
            ).toDateString()}
          </p>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt className="text-muted-foreground before:bg-primary flex items-center before:mr-2 before:block before:size-2">
              sets logged
            </dt>
            <dd>{tooltip.tooltipData.count}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: ReturnType<typeof useDashboardHeatMap>;
}>;

type Bins = GraphProps["data"][number];

type Bin = Bins["bins"][number];

type TooltipData = Readonly<
  Pick<Bin, "weekIndex" | "count"> & Pick<Bins, "dayIndex">
>;

const max = <Datum,>(data: Array<Datum>, value: (d: Datum) => number) => {
  return Math.max(...data.map(value));
};

const getBins = (d: Bins) => d.bins;
const getCount = (d: Bin) => d.count;

const margin = {
  top: -25,
  left: 0,
  right: 0,
  bottom: 0,
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

export const TilesSetsHeatMapGraphSkeleton = () => {
  return (
    <ParentSize className="relative flex overflow-hidden">
      {({ height, width }) => {
        const binSize = 30;
        const gap = 5;
        const xMax = 7 * binSize + 7 * gap;
        const centerX = width / 2 - xMax / 2;
        const marginTop = 30;
        const days = [0, 1, 2, 3, 4, 5, 6] as const;
        const weeks = [0, 1, 2, 3, 4, 5] as const;

        return (
          <Skeleton className="bg-transparent">
            <svg width={width} height={height}>
              <Group top={margin.top} left={centerX}>
                {weeks.map((i) =>
                  days.map((j) => (
                    <rect
                      key={`heatmap-rect-${i + j}`}
                      width={binSize}
                      height={binSize}
                      className="stroke-border/80 fill-border/10"
                      x={j * binSize + j * gap}
                      y={i * binSize + i * gap + marginTop}
                    />
                  )),
                )}
              </Group>
            </svg>
          </Skeleton>
        );
      }}
    </ParentSize>
  );
};

const useDashboardHeatMap = () => {
  const tiles = useTiles();

  const setsForThisMonth = tiles.data
    .filter((tile) => tile.type === "exerciseOverview")
    .flatMap((tile) => tile.exerciseOverview.exercise.sets)
    .filter((set) => {
      return (
        new Date(set.doneAt) <= new Date() && new Date() >= getFirstDayOfMonth()
      );
    });
  const setsHeatMap = transformSetsToHeatMap(setsForThisMonth);

  return setsHeatMap;
};

export const transformSetsToHeatMap = (
  sets: ReadonlyArray<Pick<Serialize<Set>, "doneAt">>,
) => {
  const setsHeatMapTemplate = generateSetsHeatMapTemplate();

  return sets
    .reduce(setsToHeatMap, setsHeatMapTemplate)
    .toSorted((a, b) => a.dayIndex - b.dayIndex)
    .map((row) => ({
      ...row,
      bins: row.bins.toSorted((a, b) => b.weekIndex - a.weekIndex),
    }));
};

const generateSetsHeatMapTemplate = () => {
  const days = [0, 1, 2, 3, 4, 5, 6] as const;
  const weeks = [0, 1, 2, 3, 4, 5] as const;

  return days.map((dayIndex) => ({
    dayIndex,
    bins: weeks.map((weekIndex) => ({
      weekIndex,
      count: 0,
    })),
  }));
};

const setsToHeatMap = (
  setsHeatMap: ReturnType<typeof generateSetsHeatMapTemplate>,
  set: Pick<Serialize<Set>, "doneAt">,
) => {
  const calendarPositions = getCalendarPositions(new Date(set.doneAt));

  return setsHeatMap.map((row) => {
    if (row.dayIndex === calendarPositions.day) {
      return {
        dayIndex: row.dayIndex,
        bins: row.bins.map((cell) => {
          if (cell.weekIndex === calendarPositions.week) {
            return {
              weekIndex: cell.weekIndex,
              count: cell.count + 1,
            };
          }

          return cell;
        }),
      };
    }

    return row;
  });
};

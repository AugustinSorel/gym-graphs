import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useMemo } from "react";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { useSuspenseQuery } from "@tanstack/react-query";
import { setQueries } from "~/set/set.queries";
import { Skeleton } from "~/ui/skeleton";
import { getFirstDayOfMonth } from "~/utils/date";
import type { RectCell } from "@visx/heatmap/lib/heatmaps/HeatmapRect";
import type { ComponentProps, CSSProperties } from "react";
import type { selectSetsHeatMapAction } from "~/set/set.actions";

export const SetsHeatMapGraph = () => {
  const setsHeatMap = useSetsHeatMap();

  const heatMapEmpty = setsHeatMap.data
    .flatMap((d) => d.bins)
    .every((e) => !e.count);

  if (heatMapEmpty) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex overflow-hidden">
      {({ height, width }) => (
        <Graph height={height} width={width} data={setsHeatMap.data} />
      )}
    </ParentSize>
  );
};

const Graph = ({ width, height, data }: GraphProps) => {
  const tooltip = useTooltip<RectCell<Bins, Bin>>();

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
            {(heatmap) =>
              heatmap.map((heatmapBins) =>
                heatmapBins.map((bin) => (
                  <rect
                    key={`heatmap-rect-${bin.row}-${bin.column}`}
                    width={bin.width}
                    height={bin.height}
                    className="stroke-primary/30 hover:!fill-primary/75 transition-colors"
                    style={{
                      fill: `hsl(var(--primary)/${(bin.opacity ?? 100) / 2})`,
                    }}
                    x={bin.x}
                    y={bin.y}
                    onMouseLeave={() => {
                      tooltipTimeout = window.setTimeout(() => {
                        tooltip.hideTooltip();
                      }, 300);
                    }}
                    onMouseMove={(e) => {
                      if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                      }

                      const eventSvgCoords = localPoint(e);

                      tooltip.showTooltip({
                        tooltipData: bin,
                        tooltipTop: eventSvgCoords?.y,
                        tooltipLeft: eventSvgCoords?.x,
                      });
                    }}
                  />
                )),
              )
            }
          </HeatmapRect>
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
                tooltip.tooltipData.datum.dayIndex +
                  1 +
                  tooltip.tooltipData.bin.weekIndex * 7 -
                  ((getFirstDayOfMonth().getDay() + 6) % 7),
              ),
            ).toDateString()}
          </p>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt className="text-muted-foreground before:bg-primary flex items-center before:mr-2 before:block before:size-2">
              sets logged
            </dt>
            <dd>{tooltip.tooltipData.bin.count}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: Awaited<ReturnType<typeof selectSetsHeatMapAction>>;
}>;

type Bins = GraphProps["data"][number];

type Bin = Bins["bins"][number];

let tooltipTimeout: number;

const max = <Datum,>(data: Array<Datum>, value: (d: Datum) => number) => {
  return Math.max(...data.map(value));
};

const getBins = (d: Bins) => d.bins;
const getCount = (d: Bin) => d.count;

const margin = {
  top: -15,
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
export const SetsHeatMapGraphSkeleton = () => {
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

const useSetsHeatMap = () => {
  return useSuspenseQuery(setQueries.heatMap);
};

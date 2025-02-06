import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { useMemo } from "react";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import type { useTiles } from "~/dashboard/hooks/use-tiles";
import type { RectCell } from "@visx/heatmap/lib/heatmaps/HeatmapRect";
import type { ComponentProps, CSSProperties } from "react";

export const SetsHeatMapGraph = (props: Props) => {
  const data = prepareData(props.exercises);

  const dataEmpty = props.exercises.every((e) => !e.sets.length);

  if (dataEmpty) {
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
                ((tooltip.tooltipData.datum.dayIndex - 1) % 7) +
                  tooltip.tooltipData.bin.weekIndex * 7,
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
  data: Array<Bins>;
}>;

type Bin = Readonly<{
  weekIndex: 0 | 1 | 2 | 3 | 4 | 5;
  count: number;
}>;

type Bins = Readonly<{
  dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  bins: Array<Bin>;
}>;

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

type Props = Readonly<{
  exercises: ReadonlyArray<Exercise>;
}>;

type Exercise = Readonly<
  NonNullable<ReturnType<typeof useTiles>["data"][number]["exercise"]>
>;

const prepareData = (exercises: ReadonlyArray<Exercise>) => {
  return exercises
    .flatMap((e) => e.sets)
    .reduce((rows, set) => {
      const firstDayOfTheMonth = new Date(new Date(set.doneAt).setDate(1));

      const offset = (firstDayOfTheMonth.getDay() + 6) % 7;

      const dayIndex = (set.doneAt.getDay() + 6) % 7;
      const dateIndex = set.doneAt.getDate();
      const weekIndex = Math.ceil((dateIndex + offset) / 7) - 1;

      return rows.map((row) => {
        if (row.dayIndex === dayIndex) {
          return {
            ...row,
            bins: row.bins.map((cell) => {
              if (cell.weekIndex === weekIndex) {
                return {
                  ...cell,
                  count: cell.count + 1,
                };
              }

              return cell;
            }),
          };
        }

        return row;
      });
    }, templateData)
    .toSorted((a, b) => a.dayIndex - b.dayIndex)
    .map((d) => ({
      ...d,
      bins: d.bins.toSorted((a, b) => b.weekIndex - a.weekIndex),
    }));
};

const templateData: ReadonlyArray<Bins> = [
  {
    dayIndex: 0,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 1,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 2,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 3,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 4,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 5,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
  {
    dayIndex: 6,
    bins: [
      {
        weekIndex: 0,
        count: 0,
      },
      {
        weekIndex: 1,
        count: 0,
      },
      {
        weekIndex: 2,
        count: 0,
      },
      {
        weekIndex: 3,
        count: 0,
      },
      {
        weekIndex: 4,
        count: 0,
      },
      {
        weekIndex: 5,
        count: 0,
      },
    ],
  },
];

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

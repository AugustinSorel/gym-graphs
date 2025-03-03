import { ParentSize } from "@visx/responsive";
import { Bar, Pie } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleLog, scaleTime } from "@visx/scale";
import { GridAngle, GridRadial } from "@visx/grid";
import { useCallback, useMemo } from "react";
import { localPoint } from "@visx/event";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "~/ui/skeleton";
import { dashboardQueries } from "~/dashboard/dashboard.queries";
import type { selectTilesToTagsCountAction } from "~/dashboard/dashboard.actions";
import type {
  ComponentProps,
  CSSProperties,
  MouseEvent,
  TouchEvent,
} from "react";

export const TilesToTagsCountGraph = () => {
  const tilesToTagsCount = useTilesToTagsCount();

  if (!tilesToTagsCount.data.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex overflow-hidden">
      {({ height, width }) => (
        <Graph height={height} width={width} data={tilesToTagsCount.data} />
      )}
    </ParentSize>
  );
};

export const TilesToTagsGraphSkeleton = () => {
  return (
    <Skeleton className="bg-transparent">
      <ParentSize className="relative flex overflow-hidden">
        {({ height, width }) => {
          return <GraphSkeleton height={height} width={width} />;
        }}
      </ParentSize>
    </Skeleton>
  );
};

const Graph = ({ width, height, data }: GraphProps) => {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const innerRadius = radius - 50;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  const top = centerY + margin.top;
  const left = centerX + margin.left;
  const maxY = height / 2.4;
  const tooltip = useTooltip<Point>();

  const xScale = useMemo(() => {
    return scaleTime({
      range: [0, Math.PI * 2],
      domain: [0, 100],
    });
  }, []);

  const yScale = useMemo(() => {
    return scaleLog<number>({
      domain: [100, 500],
      range: [0, maxY],
    });
  }, [maxY]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);

      if (!point) {
        return;
      }

      const x = point.x - width / 2;
      const y = point.y - height / 2;

      let angle = Math.atan2(x, y);
      if (angle < 0) {
        angle += 2 * Math.PI;
      }

      const angleDegrees = (angle * 180) / Math.PI;
      const z = Math.abs(((angleDegrees + 180) % 360) - 360);

      const sum = data.reduce((acc, curr) => acc + curr.count, 0);
      const angles = data.map((arc) => {
        return (360 * arc.count) / sum;
      });

      let index = 0;
      let accum = 0;

      for (const angle of angles) {
        accum += angle;

        if (z < accum) {
          break;
        }

        ++index;
      }

      const tooltipAngle = accum - (angles.at(index) ?? 0) * 0.5;

      const tooltipAngleRadians = (tooltipAngle * Math.PI) / 180;

      const tooltipX = centerX + radius * Math.sin(tooltipAngleRadians) * 4;
      const tooltipY = centerY - radius * Math.cos(tooltipAngleRadians);

      tooltip.showTooltip({
        tooltipLeft: Math.max(tooltipX, 0),
        tooltipTop: Math.max(tooltipY, 0),
        tooltipData: data.at(index),
      });
    },
    [data, tooltip, width, height],
  );

  return (
    <>
      <svg width={width} height={height}>
        <Group top={top} left={left}>
          <GridAngle
            scale={xScale}
            outerRadius={maxY}
            stroke="hsl(var(--border))"
            strokeDasharray="5,2"
            numTicks={20}
            strokeWidth={2}
            strokeOpacity={0.5}
            strokeLinecap="round"
          />

          <GridRadial
            scale={yScale}
            numTicks={1}
            stroke="hsl(var(--border))"
            strokeWidth={2}
            fill="hsl(var(--primary))"
            fillOpacity={0}
            strokeOpacity={0.5}
            height={height}
          />

          <Pie
            data={data}
            pieValue={getCount}
            outerRadius={radius}
            innerRadius={innerRadius}
            padAngle={0.1}
          >
            {(pie) => {
              return pie.arcs.map((arc) => {
                const d = pie.path(arc) ?? "";

                if (tooltip.tooltipData?.id === arc.data.id) {
                  return (
                    <g key={arc.data.name}>
                      <path
                        d={d}
                        className="fill-primary/50 stroke-primary hover:fill-primary/50 transition-colors"
                      />
                    </g>
                  );
                }

                return (
                  <g key={arc.data.name}>
                    <path
                      d={d}
                      className="fill-primary/30 stroke-primary hover:fill-primary/50 transition-colors"
                    />
                  </g>
                );
              });
            }}
          </Pie>
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
          left={Math.min(tooltip.tooltipLeft ?? 0, width - 130)}
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

const GraphSkeleton = ({ height, width }: Omit<GraphProps, "data">) => {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;
  const top = centerY + margin.top;
  const left = centerX + margin.left;
  const maxY = height / 2.4;

  const xScale = useMemo(() => {
    return scaleTime({
      range: [0, Math.PI * 2],
      domain: [0, 100],
    });
  }, []);

  const yScale = useMemo(() => {
    return scaleLog<number>({
      domain: [100, 500],
      range: [0, maxY],
    });
  }, [maxY]);

  return (
    <svg width={width} height={height}>
      <Group top={top} left={left}>
        <GridAngle
          scale={xScale}
          outerRadius={maxY}
          stroke="hsl(var(--border))"
          strokeDasharray="5,2"
          numTicks={20}
          strokeWidth={2}
          strokeOpacity={0.5}
          strokeLinecap="round"
        />

        <GridRadial
          scale={yScale}
          numTicks={1}
          stroke="hsl(var(--border))"
          strokeWidth={2}
          fill="hsl(var(--primary))"
          fillOpacity={0}
          strokeOpacity={0.5}
          height={height}
        />
      </Group>
    </svg>
  );
};
const getCount = (d: Point) => d.count;

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
} as const;

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: Awaited<ReturnType<typeof selectTilesToTagsCountAction>>;
}>;

type Point = GraphProps["data"][number];

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

const useTilesToTagsCount = () => {
  return useSuspenseQuery({
    ...dashboardQueries.tilesToTagsCount,
    select: (tilesToTagsCount) => {
      return tilesToTagsCount
        .filter((tag) => tag.count)
        .toSorted((a, b) => b.count - a.count);
    },
  });
};

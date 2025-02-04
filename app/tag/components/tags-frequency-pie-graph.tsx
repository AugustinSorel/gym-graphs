import { ParentSize } from "@visx/responsive";
import { Pie } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleLog, scaleTime } from "@visx/scale";
import { useUser } from "~/user/hooks/use-user";
import { GridAngle, GridRadial } from "@visx/grid";
import { useMemo } from "react";
import { localPoint } from "@visx/event";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import type { ComponentProps, CSSProperties } from "react";
import type { Tag } from "~/db/db.schemas";

export const TagsFrequencyPieGraph = () => {
  const user = useUser();

  const data = user.data.tags.map((tag) => ({
    name: tag.name,
    frequency: tag.exercises.length,
  }));

  const dataEmpty = data.every((d) => !d.frequency);

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
  let tooltipTimeout: number;

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
  }, [height]);

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
            pieValue={getFrequency}
            outerRadius={radius}
            innerRadius={innerRadius}
            padAngle={0.1}
          >
            {(pie) => {
              return pie.arcs.map((arc) => {
                const d = pie.path(arc) ?? "";

                return (
                  <g
                    key={arc.data.name}
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
                        tooltipData: arc.data,
                        tooltipTop: eventSvgCoords?.y,
                        tooltipLeft: eventSvgCoords?.x,
                      });
                    }}
                  >
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
            <dd>{tooltip.tooltipData.frequency}</dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const getFrequency = (d: Point) => d.frequency;

const margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
} as const;

type Point = Readonly<{
  name: Tag["name"];
  frequency: number;
}>;

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: Array<Point>;
}>;

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

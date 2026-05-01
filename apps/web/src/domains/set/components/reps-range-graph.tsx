import { scaleLinear } from "@visx/scale";
import { ParentSize } from "@visx/responsive";
import { Group } from "@visx/group";
import { defaultStyles, Tooltip, useTooltip } from "@visx/tooltip";
import { Bar } from "@visx/shape";
import { localPoint } from "@visx/event";
import {
  ComponentProps,
  MouseEvent,
  TouchEvent,
  useCallback,
  useMemo,
  type CSSProperties,
} from "react";
import { Set } from "@gym-graphs/shared/set/schemas";

export const RepsRangeGraph = (props: Props) => {
  const data = useMemo(
    () =>
      buckets.map(({ label, min, max }) => ({
        label,
        count: props.sets.filter((s) => {
          return s.repetitions >= min && s.repetitions <= max;
        }).length,
      })),
    [props.sets],
  );

  const noData = data.every((bucket) => !bucket.count);

  if (noData) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative flex min-h-full">
      {({ height, width }) => (
        <Graph height={height} width={width} data={data} />
      )}
    </ParentSize>
  );
};

const Graph = ({ height, width, data }: GraphProps) => {
  const tooltip = useTooltip<RepsRange>();

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxCount = Math.max(...data.map((d) => d.count));

  const barHeight = 6;
  const labelHeight = 14;
  const rowGap = 3;
  const rowHeight = labelHeight + rowGap + barHeight;
  const rowSpacing =
    (innerHeight - data.length * rowHeight) / (data.length - 1);

  const xScale = scaleLinear({
    domain: [0, maxCount],
    range: [0, innerWidth],
  });

  const radius = barHeight / 2;

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { y } = localPoint(event) ?? { y: 0 };

      const innerY = y - margin.top;
      const rowIndex = Math.floor(innerY / (rowHeight + rowSpacing));
      const d = data[rowIndex];

      if (!d) return;

      const barWidth = xScale(d.count);
      const rowY = rowIndex * (rowHeight + rowSpacing);
      const barY = rowY + labelHeight + rowGap;

      tooltip.showTooltip({
        tooltipData: d,
        tooltipLeft: barWidth,
        tooltipTop: barY,
      });
    },
    [data, xScale, rowHeight, rowSpacing, labelHeight, rowGap, tooltip],
  );

  return (
    <>
      <svg
        width={width}
        height={height}
        className="max-w-full overflow-visible"
      >
        <Group top={margin.top} left={margin.left}>
          {data.map((d, i) => {
            const rowY = i * (rowHeight + rowSpacing);
            const barY = rowY + labelHeight + rowGap;
            const barWidth = xScale(d.count);
            const isHovered = tooltip.tooltipData?.label === d.label;

            return (
              <Group key={d.label}>
                {/* label — left aligned */}
                <text
                  x={0}
                  y={rowY}
                  dominantBaseline="hanging"
                  textAnchor="start"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {d.label}
                </text>

                {/* count — right aligned on same row */}
                <text
                  x={innerWidth}
                  y={rowY}
                  dominantBaseline="hanging"
                  textAnchor="end"
                  className="fill-foreground"
                  fontSize={11}
                  fontWeight={600}
                >
                  {d.count}
                </text>

                {/* background track */}
                <rect
                  x={0}
                  y={barY}
                  width={innerWidth}
                  height={barHeight}
                  rx={radius}
                  ry={radius}
                  className="fill-border/40"
                />

                {/* filled bar */}
                {barWidth > 0 && (
                  <rect
                    x={0}
                    y={barY}
                    width={Math.max(barWidth, radius * 2)}
                    height={barHeight}
                    rx={radius}
                    ry={radius}
                    className={
                      isHovered ? "fill-primary/70" : "fill-primary/90"
                    }
                    style={{ transition: "fill 0.15s ease" }}
                  />
                )}
              </Group>
            );
          })}

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
        </Group>
      </svg>

      {tooltip.tooltipData && (
        <Tooltip
          top={(tooltip.tooltipTop ?? 0) + margin.top - 36}
          left={Math.min(
            (tooltip.tooltipLeft ?? 0) + margin.left + 8,
            width - 120,
          )}
          style={tooltipStyles}
        >
          <span className="text-xs font-semibold">
            {tooltip.tooltipData.label} reps
          </span>
          <span className="text-muted-foreground text-xs">
            {tooltip.tooltipData.count} sets
          </span>
        </Tooltip>
      )}
    </>
  );
};

type Props = {
  sets: ReadonlyArray<Pick<Set, "repetitions">>;
};

const buckets = [
  { label: "1–5", min: 1, max: 5 },
  { label: "6–8", min: 6, max: 8 },
  { label: "9–12", min: 9, max: 12 },
  { label: "13+", min: 13, max: Infinity },
] as const;

const margin = { top: 12, bottom: 12, left: 12, right: 12 } as const;

const tooltipStyles: Readonly<CSSProperties> = {
  ...defaultStyles,
  borderRadius: "0.5rem",
  border: "1px solid hsl(var(--border))",
  display: "flex",
  flexDirection: "column",
  gap: "0.25rem",
  color: "hsl(var(--foreground))",
  transition: "all 0.1s ease-in-out",
  backgroundColor: "hsl(var(--secondary))",
};

type RepsRange = Readonly<{ label: string; count: number }>;

type GraphProps = Readonly<{
  height: number;
  width: number;
  data: ReadonlyArray<RepsRange>;
}>;

const NoDataText = (props: ComponentProps<"p">) => (
  <p className="text-muted-foreground m-auto text-sm" {...props} />
);

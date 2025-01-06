import { bisector, extent, max } from "@visx/vendor/d3-array";
import { curveMonotoneX } from "@visx/curve";
import { GridRows } from "@visx/grid";
import { LinePath, AreaClosed, Bar } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";
import { AxisBottom } from "@visx/axis";
import { Group } from "@visx/group";
import { defaultStyles, TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { LinearGradient } from "@visx/gradient";
import { localPoint } from "@visx/event";
import {
  CSSProperties,
  MouseEvent,
  TouchEvent,
  useCallback,
  useMemo,
} from "react";
import { z } from "zod";

export const ExerciseAdvanceOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();
  const tooltip = useTooltip<Point>();

  const data = useMemo(() => {
    return props.exercisePoints.toSorted(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, []);

  const timeScale = useMemo(() => {
    return scaleTime({
      domain: extent(data, getDate) as [Date, Date],
      range: [0, width - margin.right - margin.left],
    });
  }, [margin, width]);

  const weightLiftedScale = useMemo(() => {
    return scaleLinear({
      domain: [0, max(data, getWeightLifted) ?? 0],
      range: [height - margin.top - margin.bottom, 0],
    });
  }, [margin, height]);

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = timeScale.invert(x - margin.right);
      const index = bisectDate(data, x0, 1);

      const d0 = data.at(index - 1) ?? {
        date: new Date(),
        weightLifted: 0,
      };

      const d1 = data.at(index);

      let d = d0;

      if (d1 && getDate(d1)) {
        d =
          x0.valueOf() - getDate(d0).valueOf() >
          getDate(d1).valueOf() - x0.valueOf()
            ? d1
            : d0;
      }

      tooltip.showTooltip({
        tooltipData: d,
        tooltipLeft: timeScale(getDate(d)),
        tooltipTop: weightLiftedScale(getWeightLifted(d)),
      });
    },
    [tooltip, weightLiftedScale, timeScale],
  );

  return (
    <>
      <div ref={parentRef}>
        <svg width={width} height={height}>
          {/*bottom axis*/}
          <Group top={margin.top} left={margin.left}>
            <AxisBottom
              top={height - margin.top - margin.bottom}
              scale={timeScale}
              numTicks={width > 520 ? 10 : 5}
              tickFormat={(value) => {
                const date = z
                  .number()
                  .catch(Date.now())
                  .transform((d) => new Date(d))
                  .parse(value);

                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
              tickLabelProps={{
                className: "fill-muted-foreground text-xs",
              }}
              hideTicks
              axisLineClassName="stroke-[2px] stroke-muted"
            />
          </Group>

          {/*background horizontal line*/}
          <Group top={margin.top} left={margin.left}>
            <GridRows
              scale={weightLiftedScale}
              width={width - margin.left - margin.right}
              height={height - margin.top - margin.bottom}
              className="stroke-muted"
              numTicks={4}
              strokeWidth={2}
            />
          </Group>

          {/*line graph + the gradient underneath*/}
          <Group top={margin.top} left={margin.left}>
            <LinearGradient
              id="area-gradient"
              from="hsl(var(--primary))"
              to="hsl(var(--primary))"
              toOpacity={0.2}
            />

            <AreaClosed<Point>
              data={data}
              x={(d) => timeScale(getDate(d))}
              y={(d) => weightLiftedScale(getWeightLifted(d))}
              yScale={weightLiftedScale}
              strokeWidth={0}
              stroke="url(#area-gradient)"
              fill="url(#area-gradient)"
              curve={curveMonotoneX}
            />

            <LinePath<Point>
              curve={curveMonotoneX}
              data={data}
              x={(d) => timeScale(getDate(d))}
              y={(d) => weightLiftedScale(getWeightLifted(d))}
              className="stroke-primary"
              strokeWidth={2}
              shapeRendering="geometricPrecision"
            />
          </Group>

          {/*hit zone for tooltip*/}
          <Group top={margin.top} left={margin.left}>
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
      </div>

      {tooltip.tooltipData && (
        <TooltipWithBounds
          top={tooltip.tooltipTop ?? 0}
          left={tooltip.tooltipLeft ?? 0}
          style={tooltipStyles}
        >
          <span className="size-3 rounded-sm bg-primary" />
          <span className="text-sm text-muted-foreground">weight lifted</span>
          <span className="text-sm font-semibold">
            {tooltip.tooltipData.weightLifted}
          </span>
        </TooltipWithBounds>
      )}
    </>
  );
};

const getDate = (d: Point) => d.date;
const getWeightLifted = (d: Point) => d.weightLifted;
const bisectDate = bisector<Point, Date>((d) => new Date(d.date)).left;

const margin = {
  top: 50,
  bottom: 50,
  left: 50,
  right: 50,
} as const;

const tooltipStyles: Readonly<CSSProperties> = {
  ...defaultStyles,
  borderRadius: "0.5rem",
  border: "1px solid hsl(var(--border))",
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
};

//TODO: infer type
type Point = Readonly<{
  date: Date;
  weightLifted: number;
}>;

type Props = Readonly<{
  exercisePoints: ReadonlyArray<Point>;
}>;

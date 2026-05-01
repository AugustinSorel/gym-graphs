import { extent, max } from "@visx/vendor/d3-array";
import { AreaClosed, LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";
import { curveMonotoneX } from "@visx/curve";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import { userQueries } from "~/domains/user/user.queries";
import { useBestSortedSets } from "~/domains/set/hooks/use-best-sorted-sets";
import type { ComponentProps } from "react";
import { LinearGradient } from "@visx/gradient";
import { Set } from "@gym-graphs/shared/set/schemas";
import { User } from "@gym-graphs/shared/user/schemas";

export const ExerciseOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();
  const user = useSuspenseQuery(userQueries.get);
  const sets = useBestSortedSets(props.sets);

  const timeScale = scaleTime({
    domain: extent(sets, getDoneAt) as [Date, Date],
    range: [0, width],
  });

  const oneRepMaxScale = scaleLinear({
    domain: [
      0,
      max(sets, (d) => getOneRepMax(d, user.data.oneRepMaxAlgo)) ?? 0,
    ],
    range: [height - margin.top, margin.bottom],
  });

  if (!sets.length) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <div ref={parentRef} className="overflow-hidden">
      <svg width={width} height={height}>
        <LinePath<Point>
          curve={curveMonotoneX}
          data={sets}
          x={(d) => timeScale(getDoneAt(d))}
          y={(d) => oneRepMaxScale(getOneRepMax(d, user.data.oneRepMaxAlgo))}
          className="stroke-primary"
          strokeWidth={2}
          shapeRendering="geometricPrecision"
        />

        <LinearGradient
          id="area-gradient"
          from={"#4055bf"}
          to={"#4055bf"}
          fromOpacity={0.3}
          toOpacity={0}
        />

        <AreaClosed<Point>
          data={sets}
          x={(d) => timeScale(getDoneAt(d))}
          y={(d) => oneRepMaxScale(getOneRepMax(d, user.data.oneRepMaxAlgo))}
          yScale={oneRepMaxScale}
          fill="url(#area-gradient)"
          curve={curveMonotoneX}
        />
      </svg>
    </div>
  );
};

const getDoneAt = (d: Point) => new Date(d.doneAt);
const getOneRepMax = (d: Point, algo: User["oneRepMaxAlgo"]) => {
  return calculateOneRepMax(d.weightInMg, d.repetitions, algo);
};

const margin = {
  top: 20,
  bottom: 20,
  left: 0,
  right: 0,
} as const;

type Point = Pick<Set, "weightInMg" | "repetitions" | "doneAt">;

type Props = Readonly<{
  sets: ReadonlyArray<Point>;
}>;

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

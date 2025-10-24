import { extent, max } from "@visx/vendor/d3-array";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";
import { curveMonotoneX } from "@visx/curve";
import { calculateOneRepMax } from "~/domains/set/set.utils";
import { useUser } from "~/domains/user/hooks/use-user";
import { useBestSortedSets } from "~/domains/set/hooks/use-best-sorted-sets";
import type { Set } from "@gym-graphs/api/db";
import type { ComponentProps } from "react";

export const ExerciseOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();
  const user = useUser();
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
          strokeWidth={3}
          shapeRendering="geometricPrecision"
        />
      </svg>
    </div>
  );
};

const getDoneAt = (d: Point) => d.doneAt;
const getOneRepMax = (
  d: Point,
  algo: Parameters<typeof calculateOneRepMax>[2],
) => calculateOneRepMax(d.weightInKg, d.repetitions, algo);

const margin = {
  top: 20,
  bottom: 20,
  left: 0,
  right: 0,
} as const;

type Point = Readonly<Pick<Set, "weightInKg" | "repetitions" | "doneAt">>;

type Props = Readonly<{
  sets: Array<Point>;
}>;

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

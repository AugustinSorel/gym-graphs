import { extent, max } from "@visx/vendor/d3-array";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";
import { curveMonotoneX } from "@visx/curve";
import { calculateOneRepMax } from "~/set/set.utils";
import { useUser } from "~/user/hooks/use-user";
import { useMemo } from "react";
import { useSetsByDoneAt } from "~/set/hooks/use-sets-by-done-at";
import { useBestSetsFromDoneAt } from "~/set/hooks/use-best-sets-from-done-at";
import { useSortSetsByDoneAt } from "~/set/hooks/use-sort-sets-by-done-at";
import type { Set } from "~/db/db.schemas";
import type { ComponentProps } from "react";

export const ExerciseOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();
  const user = useUser();
  const sets = useSets(props.sets);

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

const useSets = (sets: Props["sets"]) => {
  const doneAtToSets = useSetsByDoneAt(sets);
  const bestSets = useBestSetsFromDoneAt(doneAtToSets);
  const graphSets = useSortSetsByDoneAt(bestSets);

  return useMemo(() => graphSets, [graphSets]);
};

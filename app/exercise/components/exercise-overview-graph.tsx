import { extent, max } from "@visx/vendor/d3-array";
import { curveBasis } from "@visx/curve";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";
import { ExerciseSet } from "~/db/db.schemas";
import { getOneRepMaxEplay } from "~/exercise-set/exercise-set.utils";

export const ExerciseOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();

  const sets = props.sets.toSorted(
    (a, b) => a.doneAt.getTime() - b.doneAt.getTime(),
  );

  const timeScale = scaleTime({
    domain: extent(sets, getDoneAt) as [Date, Date],
    range: [0, width],
  });

  const oneRepMaxScale = scaleLinear({
    domain: [0, max(sets, getOneRepMax) ?? 0],
    range: [height - margin.top, margin.bottom],
  });

  return (
    <div ref={parentRef} className="overflow-hidden">
      <svg width={width} height={height}>
        <LinePath<Point>
          curve={curveBasis}
          data={sets}
          x={(d) => timeScale(getDoneAt(d))}
          y={(d) => oneRepMaxScale(getOneRepMax(d))}
          className="stroke-primary"
          strokeWidth={3}
          shapeRendering="geometricPrecision"
        />
      </svg>
    </div>
  );
};

const getDoneAt = (d: Point) => d.doneAt;
const getOneRepMax = (d: Point) =>
  getOneRepMaxEplay(d.weightInKg, d.repetitions);

const margin = {
  top: 20,
  bottom: 20,
  left: 0,
  right: 0,
} as const;

type Point = Readonly<
  Pick<ExerciseSet, "weightInKg" | "repetitions" | "doneAt">
>;

type Props = Readonly<{
  sets: ReadonlyArray<Point>;
}>;

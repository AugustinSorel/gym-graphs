import { extent, max } from "@visx/vendor/d3-array";
import { curveBasis } from "@visx/curve";
import { LinePath } from "@visx/shape";
import { scaleTime, scaleLinear } from "@visx/scale";
import { useParentSize } from "@visx/responsive";

export const ExerciseOverviewGraph = (props: Props) => {
  const { parentRef, width, height } = useParentSize();

  const data = props.exercisePoints.toSorted(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const timeScale = scaleTime({
    domain: extent(data, getDate) as [Date, Date],
    range: [0, width],
  });

  const weightLiftedScale = scaleLinear({
    domain: [0, max(data, getWeightLifted) ?? 0],
    range: [height - margin.top, margin.bottom],
  });

  return (
    <div ref={parentRef} className="overflow-hidden">
      <svg width={width} height={height}>
        <LinePath<Point>
          curve={curveBasis}
          data={data}
          x={(d) => timeScale(getDate(d))}
          y={(d) => weightLiftedScale(getWeightLifted(d))}
          className="stroke-primary"
          strokeWidth={3}
          shapeRendering="geometricPrecision"
        />
      </svg>
    </div>
  );
};

const getDate = (d: Point) => d.date;
const getWeightLifted = (d: Point) => d.weightLifted;

const margin = { top: 20, bottom: 20, left: 0, right: 0 } as const;

//TODO: infer type
type Point = Readonly<{
  date: Date;
  weightLifted: number;
}>;

type Props = Readonly<{
  exercisePoints: ReadonlyArray<Point>;
}>;

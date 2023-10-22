"use client";
//TODO:remove hydration warning

import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { Point } from "@visx/point";
import { Line, LineRadial } from "@visx/shape";
import { useDimensions } from "@/hooks/useDimensions";
import type { Exercise } from "@/db/types";

export type RadarGraphData = {
  frequency: number;
  exerciseName: Exercise["name"];
};

const degrees = 360;
const margin = { top: 20, left: 20, right: 20, bottom: 20 };

const y = (d: RadarGraphData) => d.frequency;

const genAngles = (length: number) =>
  [...new Array<number>(length + 1)].map((_, i) => ({
    angle: +(
      i * (degrees / length) +
      (length % 2 === 0 ? 0 : degrees / length / 2)
    ).toFixed(3),
  }));

const genPoints = (length: number, radius: number) => {
  const step = (Math.PI * 2) / length;
  return [...new Array<number>(length)].map((_, i) => ({
    x: +(radius * Math.sin(i * step)).toFixed(3),
    y: +(radius * Math.cos(i * step)).toFixed(3),
  }));
};

function genPolygonPoints(
  dataArray: RadarGraphData[],
  scale: (n: number) => number,
  getValue: (d: RadarGraphData) => number
) {
  const step = (Math.PI * 2) / dataArray.length;
  const points = new Array<{ x: number; y: number }>(dataArray.length).fill({
    x: 0,
    y: 0,
  });
  const pointString = new Array<string>(dataArray.length + 1)
    .fill("")
    .reduce((res, _, i) => {
      if (i > dataArray.length) return res;
      const defaultValue = { frequency: -1, exerciseName: "" };
      const xVal =
        scale(getValue(dataArray[i - 1] ?? defaultValue)) * Math.sin(i * step);
      const yVal =
        scale(getValue(dataArray[i - 1] ?? defaultValue)) * Math.cos(i * step);
      points[i - 1] = { x: xVal, y: yVal };
      res += `${xVal.toFixed(3)},${yVal.toFixed(3)} `;
      return res;
    });

  return { points, pointString };
}

export type RadarProps = {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  levels?: number;
};

export const RadarGraph = ({ data }: { data: RadarGraphData[] }) => {
  const dimensions = useDimensions<SVGSVGElement>();

  const xMax = dimensions.width - margin.left - margin.right;
  const yMax = dimensions.height - margin.top - margin.bottom;

  const radius = Math.min(xMax, yMax) / 2;
  const levels = 5;

  const radialScale = scaleLinear<number>({
    range: [0, Math.PI * 2],
    domain: [degrees, 0],
  });

  const yScale = scaleLinear<number>({
    range: [0, radius],
    domain: [0, Math.max(...data.map(y))],
  });

  const webs = genAngles(data.length);
  const points = genPoints(data.length, radius);
  const polygonPoints = genPolygonPoints(data, (d) => yScale(d) ?? 0, y);
  const zeroPoint = new Point({ x: 0, y: 0 });

  return (
    <svg
      height="100%"
      width="100%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      ref={dimensions.ref}
      className="p-2"
    >
      <Group top={dimensions.height / 2} left={dimensions.width / 2}>
        <Group>
          {[...new Array<number>(levels)].map((_, i) => (
            <LineRadial
              key={`web-${i}`}
              data={webs}
              angle={(d) => radialScale(d.angle) ?? 0}
              radius={((i + 1) * radius) / levels}
              fill="none"
              className="stroke-muted-foreground"
              strokeLinecap="round"
            />
          ))}
        </Group>

        <Group>
          {[...new Array<number>(data.length)].map((_, i) => (
            <Line
              key={`radar-line-${i}`}
              from={zeroPoint}
              to={points[i]}
              className="stroke-muted-foreground"
            />
          ))}
        </Group>

        <polygon
          points={polygonPoints.pointString}
          className="fill-brand-color-two/30 stroke-brand-color-two"
        />

        <Group>
          {data.map((d, i) => {
            const index = i === 0 ? 1 : i === data.length - 1 ? 0 : i + 1;
            const point = points[index] ?? { x: 0, y: 0 };
            return (
              <text
                key={`exercise-name-${i}`}
                y={point.y}
                x={point.x}
                className="fill-muted-foreground text-xs"
                dy={point.y === 0 ? "0.5em" : point.y > 0 ? "1em" : "-0.5em"}
                dx={point.x === 0 ? "0.5em" : point.x > 0 ? "1em" : "-0.5em"}
                textAnchor={
                  point.x === 0 ? "middle" : point.x > 0 ? "start" : "end"
                }
              >
                {d.exerciseName}
              </text>
            );
          })}
        </Group>

        {polygonPoints.points.map((point, i) => (
          <circle
            key={`radar-point-${i}`}
            cx={point.x.toFixed(3)}
            cy={point.y.toFixed(3)}
            r={4}
            className="fill-brand-color-two"
          />
        ))}
      </Group>
    </svg>
  );
};

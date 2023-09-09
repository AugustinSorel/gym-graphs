"use client";

import { useRef } from "react";
import type { ComponentProps } from "react";
import genBins, { Bin, Bins } from "@visx/mock-data/lib/generators/genBins";
import { scaleLinear } from "@visx/scale";
import { HeatmapRect } from "@visx/heatmap";
import { getSeededRandom } from "@visx/mock-data";
import { useDimensions } from "@/hooks/useDimensions";

const cool1 = "#ffffff00";
const cool2 = "#ef5da8";

const seededRandom = getSeededRandom(0.41);

const binData = genBins(
  /* length = */ 7,
  /* height = */ 5,
  /** binFunc */ (idx) => 150 * idx,
  /** countFunc */ (i, number) => 25 * (number - i) * seededRandom()
);

function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
  return Math.max(...data.map(value));
}

// accessors
const bins = (d: Bins) => d.bins;
const count = (d: Bin) => d.count;

const colorMax = max(binData, (d) => max(bins(d), count));
const bucketSizeMax = max(binData, (d) => bins(d).length);

// scales
const xScale = scaleLinear<number>({
  domain: [0, binData.length],
});

const yScale = scaleLinear<number>({
  domain: [0, bucketSizeMax],
});

const rectColorScale = scaleLinear<string>({
  range: [cool1, cool2],
  domain: [0, colorMax],
});

const opacityScale = scaleLinear<number>({
  range: [0.1, 1],
  domain: [0, colorMax],
});

const DEFAULT_WIDTH = 302;
const DEFAULT_HEIGHT = 253;

const weekDays = ["m", "t", "w", "t", "f", "s", "s"];

export const HeatmapGraph = () => {
  const dimensions = useDimensions(DEFAULT_WIDTH, DEFAULT_HEIGHT);
  const heatmapRef = useRef<SVGGElement | null>(null);

  console.log((heatmapRef.current?.getBBox().width ?? 0) / 2);

  const gap = 5;
  const binWidth = 30;

  const xMax = 7 * binWidth + 7 * gap;
  const yMax = 5 * binWidth + 5 * gap;

  const heatmapX =
    dimensions.width / 2 - (heatmapRef.current?.getBBox().width ?? 0) / 2;

  const heatmapY =
    dimensions.height / 2 -
    (heatmapRef.current?.getBBox().height ?? 0) / 2 -
    20;

  xScale.range([0, xMax]);
  yScale.range([yMax, 0]);

  return (
    <svg
      height="100%"
      width="100%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      ref={dimensions.ref}
    >
      <g>
        {weekDays.map((day, i) => {
          const offset = binWidth * i + gap * i;
          const charWidth = 10;

          return (
            <HeatmapText key={i} x={heatmapX + offset + charWidth}>
              {day}
            </HeatmapText>
          );
        })}
      </g>

      <g transform={`translate(${heatmapX},${heatmapY})`} ref={heatmapRef}>
        <HeatmapRect
          data={binData}
          xScale={(d) => xScale(d) ?? 0}
          yScale={(d) => yScale(d) ?? 0}
          colorScale={rectColorScale}
          opacityScale={opacityScale}
          binWidth={binWidth}
          binHeight={binWidth}
        >
          {(heatmap) =>
            heatmap.map((heatmapBins) =>
              heatmapBins.map((bin) => (
                <rect
                  key={`heatmap-rect-${bin.row}-${bin.column}`}
                  width={bin.width}
                  height={bin.height}
                  x={bin.x}
                  y={bin.y}
                  fill={bin.color}
                  fillOpacity={bin.opacity}
                />
              ))
            )
          }
        </HeatmapRect>
      </g>
    </svg>
  );
};

const HeatmapText = (props: ComponentProps<"text">) => {
  return (
    <text
      {...props}
      y="30"
      fill="fill-"
      className="fill-muted-foreground text-xs capitalize"
    />
  );
};

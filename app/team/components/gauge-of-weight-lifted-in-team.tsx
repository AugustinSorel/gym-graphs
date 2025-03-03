import { Group } from "@visx/group";
import { ParentSize } from "@visx/responsive";
import { Arc, Bar } from "@visx/shape";
import { Text } from "@visx/text";
import { convertUserWeightUnitToSymbol } from "~/weight-unit/weight-unit.utils";
import { useUser } from "~/user/hooks/use-user";
import { defaultStyles, useTooltip, Tooltip } from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { WeightValue } from "~/weight-unit/components/weight-value";
import { WeightUnit } from "~/weight-unit/components/weight-unit";
import { cn } from "~/styles/styles.utils";
import { useTeam } from "~/team/hooks/use-team";
import { getRouteApi } from "@tanstack/react-router";
import type { Set } from "~/db/db.schemas";
import {
  type MouseEvent,
  type TouchEvent,
  type ComponentProps,
  type CSSProperties,
  useCallback,
} from "react";

export const GaugeOfWeightLiftedInTeam = () => {
  const weightLiftedInTeam = useWeightLiftedInTeam();

  if (!weightLiftedInTeam.total) {
    return <NoDataText>no data</NoDataText>;
  }

  return (
    <ParentSize className="relative overflow-hidden">
      {({ height, width }) => (
        <Graph
          height={height}
          width={width}
          totalWeightInKg={weightLiftedInTeam.total}
          userTotalWeightInKg={weightLiftedInTeam.user}
        />
      )}
    </ParentSize>
  );
};

const routeApi = getRouteApi("/(teams)/teams_/$teamId");

const Graph = (props: GraphProps) => {
  const user = useUser();
  const tooltip = useTooltip<TooltipData>();

  const min = 0;
  const max = props.totalWeightInKg;

  const radius = 120;
  const angleRange = Math.PI;

  const normalizedValue = Math.max(
    0,
    Math.min(1, (props.userTotalWeightInKg - min) / (max - min)),
  );

  const handleTooltip = useCallback(
    (event: TouchEvent<SVGRectElement> | MouseEvent<SVGRectElement>) => {
      const point = localPoint(event);

      if (!point) {
        return;
      }
      const data = [
        props.userTotalWeightInKg,
        props.totalWeightInKg - props.userTotalWeightInKg,
      ] as const;

      const cx = props.width / 2;
      const cy = props.height / 2 + 55;

      const x = point.x - cx;
      const y = point.y - cy;

      let angle = Math.atan2(x, y);
      if (angle < 0) {
        angle += 2 * Math.PI;
      }

      const offset =
        (360 * props.userTotalWeightInKg) / props.totalWeightInKg / 2;

      const angleDegrees = (angle * 180) / Math.PI;
      const z = Math.abs(((angleDegrees + 90 - offset) % 360) - 360);

      const sum = props.totalWeightInKg;

      const angles = data.map((arc) => {
        return (360 * arc) / sum;
      });

      let index = 0;
      let accum = 0;

      for (const angle of angles) {
        accum += angle;

        if (z < accum) {
          break;
        }

        ++index;
      }

      const tooltipAngle = accum - (angles.at(index) ?? 0) * 0.5;

      const tooltipAngleRadians = (tooltipAngle * Math.PI) / 180;

      const tooltipX = cx - radius * Math.sin(tooltipAngleRadians) * 4;
      const tooltipY = 0;

      tooltip.showTooltip({
        tooltipLeft: Math.max(tooltipX, 0),
        tooltipTop: Math.max(tooltipY, 0),
        tooltipData: {
          entity: index === 0 ? "you" : "team",
          weightInKg: data.at(index) ?? 0,
        },
      });
    },
    [tooltip, props],
  );

  return (
    <>
      <svg width={props.width} height={props.height}>
        <Group top={props.height / 2 + margin.top} left={props.width / 2}>
          <Arc
            suppressHydrationWarning
            innerRadius={radius - 15}
            outerRadius={radius}
            startAngle={-Math.PI / 2}
            endAngle={-Math.PI / 2 + normalizedValue * angleRange - 0.05}
            cornerRadius={6}
            className="fill-primary/80"
          />

          <Arc
            suppressHydrationWarning
            innerRadius={radius - 15}
            outerRadius={radius}
            startAngle={Math.PI / 2}
            endAngle={-Math.PI / 2 + normalizedValue * angleRange}
            cornerRadius={6}
            className="fill-border/80"
          />

          {/*team tooltip indicator*/}
          {tooltip.tooltipData && tooltip.tooltipData.entity === "team" && (
            <Arc
              suppressHydrationWarning
              innerRadius={radius - 15}
              outerRadius={radius}
              startAngle={Math.PI / 2}
              endAngle={-Math.PI / 2 + normalizedValue * angleRange}
              cornerRadius={6}
              className="fill-border"
            />
          )}

          {/*user tooltip indicator*/}
          {tooltip.tooltipData && tooltip.tooltipData.entity === "you" && (
            <Arc
              suppressHydrationWarning
              innerRadius={radius - 15}
              outerRadius={radius}
              startAngle={-Math.PI / 2}
              endAngle={-Math.PI / 2 + normalizedValue * angleRange - 0.05}
              cornerRadius={6}
              className="fill-primary"
            />
          )}

          <Text
            textAnchor="middle"
            className="fill-foreground"
            fontSize={24}
            dy={0}
            fontWeight="bold"
          >
            {`${props.userTotalWeightInKg} ${convertUserWeightUnitToSymbol(user.data.weightUnit)}`}
          </Text>
        </Group>

        {/*hit zone for tooltip*/}
        <Group top={0} left={0}>
          <Bar
            width={props.width}
            height={props.height}
            fill="transparent"
            onMouseMove={handleTooltip}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseLeave={tooltip.hideTooltip}
          />
        </Group>
      </svg>

      {tooltip.tooltipData && (
        <Tooltip
          top={Math.min(tooltip.tooltipTop ?? 0, props.height - 75)}
          left={Math.min(tooltip.tooltipLeft ?? 0, props.width - 175)}
          style={tooltipStyles}
        >
          <p className="text-xs font-bold capitalize">
            {tooltip.tooltipData.entity}
          </p>
          <dl className="[&>dt]:text-muted-foreground grid grid-cols-[1fr_auto] items-center gap-x-2 text-xs whitespace-nowrap [&>dd]:ml-auto [&>dd]:font-semibold">
            <dt
              className={cn(
                "text-muted-foreground flex items-center before:mr-2 before:block before:size-2",
                tooltip.tooltipData.entity === "you" && "before:bg-primary",
                tooltip.tooltipData.entity === "team" &&
                  "before:bg-muted-foreground",
              )}
            >
              weight lifted
            </dt>
            <dd>
              <WeightValue weightInKg={tooltip.tooltipData.weightInKg} />{" "}
              <WeightUnit />
            </dd>
          </dl>
        </Tooltip>
      )}
    </>
  );
};

const useWeightLiftedInTeam = () => {
  const params = routeApi.useParams();
  const user = useUser();
  const team = useTeam(params.teamId);

  const userMember = team.data.members.find((member) => {
    return (member.userId = user.data.id);
  });

  if (!userMember) {
    throw new Error("user not part of team");
  }

  const userTotalWeightInKg = userMember.totalWeightInKg;
  const totalWeightInKg = team.data.members.reduce((acc, curr) => {
    return acc + curr.totalWeightInKg;
  }, 0);

  return {
    user: userTotalWeightInKg,
    total: totalWeightInKg,
  };
};

type GraphProps = Readonly<{
  height: number;
  width: number;
  totalWeightInKg: Set["weightInKg"];
  userTotalWeightInKg: Set["weightInKg"];
}>;

type TooltipData = { weightInKg: Set["weightInKg"]; entity: "you" | "team" };

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

const margin = {
  top: 60,
  bottom: 0,
  left: 0,
  right: 0,
} as const;

const NoDataText = (props: ComponentProps<"p">) => {
  return <p className="text-muted-foreground m-auto text-sm" {...props} />;
};

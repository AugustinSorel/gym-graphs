"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TIMEFRAMES = [
  {
    abbreviation: "all",
    tooltipText: "view all data",
  },
  {
    abbreviation: "1y",
    tooltipText: "view this year data",
  },
  {
    abbreviation: "6m",
    tooltipText: "view this 6 months data",
  },
  {
    abbreviation: "1m",
    tooltipText: "view this month data",
  },
  {
    abbreviation: "1w",
    tooltipText: "view this week data",
  },
] as const;

const ExerciseGraph = () => {
  return (
    <div className="rounded-md border border-border bg-primary backdrop-blur-md">
      <header className="border-b border-border bg-primary p-3">
        <h2 className="truncate font-medium capitalize">bench press</h2>
      </header>

      <div className="h-[500px]"></div>

      <footer className="flex items-center justify-center overflow-x-auto border-t border-border bg-primary text-xl">
        {TIMEFRAMES.map((timeframe) => (
          <TimeframeLink timeframe={timeframe} key={timeframe.abbreviation} />
        ))}
      </footer>
    </div>
  );
};

export default ExerciseGraph;

type TimeframeLinkProps = { timeframe: (typeof TIMEFRAMES)[number] };

const TimeframeLink = ({ timeframe }: TimeframeLinkProps) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="link"
            className="uppercase aria-[current=true]:underline"
            asChild
          >
            <Link
              href={`${pathname}?timeframe=${timeframe.abbreviation}`}
              aria-current={
                searchParams.get("timeframe") === timeframe.abbreviation
              }
            >
              {timeframe.abbreviation}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{timeframe.tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

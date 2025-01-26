import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "~/styles/styles.utils";
import { Button } from "~/ui/button";
import { createContext, use, useCallback, useEffect, useState } from "react";
import type { UseEmblaCarouselType } from "embla-carousel-react";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  scrollTo: (index: number) => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = use(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = ({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & CarouselProps) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback((api: CarouselApi) => {
    if (!api) {
      return;
    }

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api],
  );

  const scrollNext = useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  useEffect(() => {
    if (!api || !setApi) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        scrollTo,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
};
Carousel.displayName = "Carousel";

const CarouselContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const { carouselRef, orientation } = useCarousel();

  return (
    <div ref={carouselRef} className="w-full overflow-hidden">
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "" : "flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
};
CarouselContent.displayName = "CarouselContent";

const CarouselItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
      {...props}
    />
  );
};
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = ({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-left-12 top-1/2 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
};
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = ({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) => {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "absolute h-8 w-8 rounded-full",
        orientation === "horizontal"
          ? "-right-12 top-1/2 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
};
CarouselNext.displayName = "CarouselNext";

const CarouselDot = ({
  className,
  variant = "outline",
  size = "icon",
  index,
  ...props
}: React.ComponentProps<typeof Button> & { index: number }) => {
  const carousel = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "size-4 rounded-full data-[selected=true]:bg-primary",
        className,
      )}
      onClick={() => carousel.scrollTo(index)}
      data-selected={index === carousel.api?.selectedScrollSnap()}
      {...props}
    >
      <span className="sr-only">go to {index}</span>
    </Button>
  );
};
CarouselDot.displayName = "CarouselDot";

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  CarouselDot,
};

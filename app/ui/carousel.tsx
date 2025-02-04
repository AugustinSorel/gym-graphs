import { useParentSize } from "@visx/responsive";
import { createContext, use, useState } from "react";
import { Button } from "~/ui/button";
import { cn } from "~/styles/styles.utils";
import type { ButtonProps } from "~/ui/button";
import type { ComponentProps, CSSProperties } from "react";

type Ctx = Readonly<{
  index: number;
  itemsCount: number;
  rootWidth: number;
  next: () => void;
  prev: () => void;
  goTo: (index: Ctx["index"]) => void;
}>;

const Ctx = createContext<Ctx | undefined>(undefined);

const useCarousel = () => {
  const ctx = use(Ctx);

  if (!ctx) {
    throw new Error("useCarousel must be wrapped inside of a <Carousel/>");
  }

  return ctx;
};

const useCarouselInternal = () => {
  const [index, setIndex] = useState(0);

  const next = () => {
    setIndex((prev) => prev + 1);
  };

  const prev = () => {
    setIndex((prev) => prev - 1);
  };

  const goTo = (index: Ctx["index"]) => {
    setIndex(index);
  };

  return {
    next,
    prev,
    goTo,
    index,
  };
};

export const Carousel = ({
  className,
  ...props
}: Readonly<ComponentProps<"div">>) => {
  const parentSize = useParentSize({ debounceTime: 500 });
  const itemsCount =
    parentSize.parentRef?.current?.children.item(0)?.childElementCount ?? 0;
  const carouselInternal = useCarouselInternal();

  return (
    <Ctx
      value={{
        index: carouselInternal.index,
        next: carouselInternal.next,
        prev: carouselInternal.prev,
        goTo: carouselInternal.goTo,
        itemsCount,
        rootWidth: parentSize.width,
      }}
    >
      <div
        ref={parentSize.parentRef}
        className={cn(
          "group relative isolate flex h-full w-full overflow-hidden",
          className,
        )}
        {...props}
      />
    </Ctx>
  );
};

const useCarouselDrag = () => {
  const carousel = useCarousel();
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [draggingDistance, setDraggingDistance] = useState(0);
  const minDragDistance = 10;

  const startHandler = (startX: number) => {
    if (carousel.itemsCount < 2) {
      return;
    }

    setTouchEnd(0);
    setTouchStart(startX);
  };

  const moveHandler = (currentX: number) => {
    if (!touchStart) {
      return;
    }

    const distance = touchStart - currentX;

    setTouchEnd(currentX);
    setDraggingDistance(distance);
  };

  const endHandler = () => {
    if (!draggingDistance) {
      setDraggingDistance(0);
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    const distance = touchStart - touchEnd;

    if (Math.abs(distance) < minDragDistance) {
      setDraggingDistance(0);
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    const isLeftSwipe = distance > minDragDistance;
    setDraggingDistance(0);
    setTouchStart(0);
    setTouchEnd(0);

    if (isLeftSwipe && carousel.index !== carousel.itemsCount - 1) {
      carousel.next();
    }

    if (!isLeftSwipe && carousel.index !== 0) {
      carousel.prev();
    }
  };

  const getCursorType = (): CSSProperties["cursor"] => {
    if (Math.abs(draggingDistance) > 0) {
      return "grabbing";
    }

    if (carousel.itemsCount > 1) {
      return "grab";
    }

    return "auto";
  };

  const isDragging = () => {
    return Math.abs(draggingDistance) > minDragDistance;
  };

  return {
    getCursorType,
    startHandler,
    endHandler,
    moveHandler,
    isDragging,
    draggingDistance,
  };
};

export const CarouselBody = (props: Readonly<ComponentProps<"ul">>) => {
  const carousel = useCarousel();
  const carouselDrag = useCarouselDrag();

  const distance =
    carousel.rootWidth * carousel.index * -1 -
    (carouselDrag.isDragging() ? carouselDrag.draggingDistance : 0);

  if (!carousel.itemsCount) {
    return null;
  }

  return (
    <ul
      className="absolute inset-0 -z-10 grid transition-[translate] select-none"
      style={{
        translate: `${distance}px 0`,
        gridTemplateColumns: `repeat(${carousel.itemsCount},${carousel.rootWidth}px)`,
        cursor: carouselDrag.getCursorType(),
      }}
      onTouchStart={(e) => {
        const x = e.targetTouches[0]?.clientX ?? 0;
        carouselDrag.startHandler(x);
      }}
      onMouseDown={(e) => {
        const x = e.clientX;
        carouselDrag.startHandler(x);
      }}
      onTouchMove={(e) => {
        const x = e.targetTouches[0]?.clientX ?? 0;
        carouselDrag.moveHandler(x);
      }}
      onMouseMove={(e) => {
        const x = e.clientX;
        carouselDrag.moveHandler(x);
      }}
      onTouchEnd={carouselDrag.endHandler}
      onMouseUp={carouselDrag.endHandler}
      onMouseLeave={carouselDrag.endHandler}
      {...props}
    />
  );
};

export const CarouselItem = (props: Readonly<ComponentProps<"li">>) => {
  return <li {...props} />;
};

export const CarouselDot = ({
  className,
  index,
  variant = "outline",
  size = "icon",
  ...props
}: ButtonProps & { index: number }) => {
  const carousel = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "data-[selected=true]:bg-primary size-4 rounded-full",
        className,
      )}
      onClick={() => carousel.goTo(index)}
      data-selected={index === carousel.index}
      aria-label={`go to ${index}`}
      {...props}
    >
      <span className="sr-only">go to {index}</span>
    </Button>
  );
};

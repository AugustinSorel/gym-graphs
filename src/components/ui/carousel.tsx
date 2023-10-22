"use client";

import { createContext, useContext, useState } from "react";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";
import { Button } from "./button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDimensions } from "@/hooks/useDimensions";

type CarouselContext = {
  itemsSize: number;
  currentItemIndex: number;
  rootWidth: number;
  goToPreviousItem: () => void;
  goToNextItem: () => void;
  goToSpecificItem: (index: number) => void;
};

const CarouselContext = createContext<CarouselContext | null>(null);

type CarouselProviderProps = PropsWithChildren &
  Pick<CarouselContext, "rootWidth" | "itemsSize">;

const CarouselProvider = ({
  children,
  rootWidth,
  itemsSize,
}: CarouselProviderProps) => {
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const goToNextItem = () => {
    setCurrentItemIndex((prev) => (prev >= itemsSize - 1 ? 0 : prev + 1));
  };

  const goToPreviousItem = () => {
    setCurrentItemIndex((prev) => (prev <= 0 ? itemsSize - 1 : prev - 1));
  };

  const goToSpecificItem = (index: number) => {
    if (index < 0 || index > itemsSize - 1) {
      return;
    }

    setCurrentItemIndex(index);
  };

  return (
    <CarouselContext.Provider
      value={{
        itemsSize,
        currentItemIndex,
        goToNextItem,
        goToPreviousItem,
        goToSpecificItem,
        rootWidth,
      }}
    >
      {children}
    </CarouselContext.Provider>
  );
};

const useCarousel = () => {
  const ctx = useContext(CarouselContext);

  if (!ctx) {
    throw new Error(
      "carousel context should be used inside of the <CarouselProvider.Provider>"
    );
  }

  return ctx;
};

type RootProps = ComponentPropsWithoutRef<"div"> &
  Pick<CarouselContext, "itemsSize">;

const Root = ({ itemsSize, ...rest }: RootProps) => {
  const dimensions = useDimensions<HTMLDivElement>(300, 300);

  return (
    <CarouselProvider rootWidth={dimensions.width} itemsSize={itemsSize}>
      <div
        {...rest}
        ref={dimensions.ref}
        className="group relative isolate flex h-full w-full overflow-hidden p-2"
      />
    </CarouselProvider>
  );
};

const ArrowNavigation = () => {
  const carousel = useCarousel();

  if (carousel.itemsSize < 2) {
    return null;
  }

  return (
    <nav className="pointer-events-none absolute left-0 right-0 top-1/2 mx-2 flex -translate-y-1/2 justify-between">
      <Button
        title="go to next item"
        name="go to next item"
        className="opacity-full-on-touch-device h-8 rounded-full opacity-0 backdrop-blur-md transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
        onClick={carousel.goToPreviousItem}
        size="icon"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        title="go to previous item"
        name="go to previous item"
        className="opacity-full-on-touch-device h-8 rounded-full opacity-0 backdrop-blur-md transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
        onClick={carousel.goToNextItem}
        size="icon"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </nav>
  );
};

const DotsNavigation = () => {
  const carousel = useCarousel();

  if (carousel.itemsSize < 2) {
    return null;
  }

  return (
    <nav className=" mx-auto mt-auto flex items-center gap-3">
      {[...Array<unknown>(carousel.itemsSize)].map((_, i) => (
        <Button
          key={i}
          aria-current={i === carousel.currentItemIndex}
          name={`view post ${i + 1}`}
          title={`view post ${i + 1}`}
          className="aspect-square h-4 w-4 rounded-full p-0 aria-[current=true]:bg-brand-color-two/30"
          onClick={() => carousel.goToSpecificItem(i)}
          size="icon"
        />
      ))}
    </nav>
  );
};

const Body = (props: PropsWithChildren) => {
  const carousel = useCarousel();

  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [draggingDistance, setDraggingDistance] = useState(0);
  const minSwipeDistance = 50;

  const draggingStart = (startX: number) => {
    if (carousel.itemsSize < 2) {
      return;
    }

    setTouchEnd(0);
    setTouchStart(startX);
  };

  const draggingMove = (currentX: number) => {
    const distance = touchStart - currentX;

    if (!touchStart || Math.abs(distance) < 50) {
      return;
    }

    setTouchEnd(currentX);
    setDraggingDistance(distance);
  };

  const draggingEnd = () => {
    if (!draggingDistance) {
      return;
    }

    const distance = touchStart - touchEnd;

    if (Math.abs(distance) < 50) {
      setDraggingDistance(0);
      setTouchStart(0);
      setTouchEnd(0);
      return;
    }

    const isLeftSwipe = distance > minSwipeDistance;
    setDraggingDistance(0);
    setTouchStart(0);
    setTouchEnd(0);

    if (isLeftSwipe && carousel.currentItemIndex !== carousel.itemsSize - 1) {
      carousel.goToNextItem();
    }

    if (!isLeftSwipe && carousel.currentItemIndex !== 0) {
      carousel.goToPreviousItem();
    }
  };

  return (
    <div
      className="absolute inset-0 -z-10 grid select-none duration-300"
      style={{
        translate: `${
          carousel.rootWidth * carousel.currentItemIndex * -1 - draggingDistance
        }px 0`,
        gridTemplateColumns: `repeat(${carousel.itemsSize},${carousel.rootWidth}px)`,
        cursor: carousel.itemsSize > 1 ? "grab" : "auto",
      }}
      onTouchStart={(e) => draggingStart(e.targetTouches[0]?.clientX ?? 0)}
      onTouchMove={(e) => draggingMove(e.targetTouches[0]?.clientX ?? 0)}
      onTouchEnd={draggingEnd}
      onMouseDown={(e) => draggingStart(e.clientX)}
      onMouseMove={(e) => draggingMove(e.clientX)}
      onMouseUp={draggingEnd}
      onMouseLeave={draggingEnd}
      {...props}
    />
  );
};

export const Carousel = {
  Root,
  ArrowNavigation,
  DotsNavigation,
  Body,
};

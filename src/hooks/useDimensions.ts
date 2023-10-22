import { useCallback, useLayoutEffect, useRef, useState } from "react";

//FIXME: remove props
export const useDimensions = <T extends HTMLElement | SVGElement>(
  DEFAULT_WIDTH: number,
  DEFAULT_HEIGHT: number
) => {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const onResizeHandler = useCallback(() => {
    if (!ref.current) {
      return;
    }

    setDimensions({
      width: ref.current.clientWidth ?? DEFAULT_WIDTH,
      height: ref.current.clientHeight ?? DEFAULT_HEIGHT,
    });
  }, [DEFAULT_HEIGHT, DEFAULT_WIDTH]);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new ResizeObserver(onResizeHandler);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [onResizeHandler]);

  return {
    ref,
    ...dimensions,
  };
};

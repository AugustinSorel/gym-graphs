import { useCallback, useLayoutEffect, useRef, useState } from "react";

export const useDimensions = <T extends HTMLElement | SVGElement>() => {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const onResizeHandler = useCallback(() => {
    if (!ref.current) {
      return;
    }

    setDimensions({
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
    });
  }, []);

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

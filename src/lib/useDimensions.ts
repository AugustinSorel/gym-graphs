import { useLayoutEffect, useRef, useState } from "react";

export const useDimensions = (
  DEFAULT_WIDTH: number,
  DEFAULT_HEIGHT: number
) => {
  const ref = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  useLayoutEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: ref.current?.clientWidth ?? DEFAULT_WIDTH,
        height: ref.current?.clientHeight ?? DEFAULT_HEIGHT,
      });
    };

    window.addEventListener("resize", updateSize);

    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, [DEFAULT_WIDTH, DEFAULT_HEIGHT]);

  return {
    ref,
    ...dimensions,
  };
};

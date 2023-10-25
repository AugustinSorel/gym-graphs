import { useLayoutEffect, useRef, useState } from "react";

export const useDimensions = <T extends HTMLElement | SVGElement>() => {
  const ref = useRef<T>(null);
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const updateSize = () => {
      setDimensions({
        width: ref.current?.clientWidth ?? 0,
        height: ref.current?.clientHeight ?? 0,
      });
    };

    window.addEventListener("resize", updateSize);

    updateSize();

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return {
    ref,
    ...dimensions,
  };
};

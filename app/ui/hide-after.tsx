import { useEffect, useState } from "react";
import type { PropsWithChildren } from "react";

export const HideAfter = (
  props: Readonly<PropsWithChildren<{ time?: number }>>,
) => {
  const [hide, setHide] = useState(false);
  const time = props.time ?? 5_000;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHide(true);
    }, time);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (hide) {
    return null;
  }

  return props.children;
};

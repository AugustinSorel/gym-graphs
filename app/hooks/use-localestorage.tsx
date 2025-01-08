import { z } from "zod";

export const useLocalStorage = <T extends z.Schema>(key: string, schema: T) => {
  const get = (): T["_output"] => {
    const unsafeValue = localStorage.getItem(key);

    return schema.parse(unsafeValue);
  };

  const set = (value: T["_output"]) => {
    localStorage.setItem(key, value);
  };

  return { get, set };
};

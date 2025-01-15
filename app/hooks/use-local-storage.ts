import { useCallback } from "react";
import type { ZodSchema } from "zod";

export const useLocalStorage = <TSchema extends ZodSchema>(
  key: string,
  schema: TSchema,
) => {
  const get = useCallback((): TSchema["_output"] => {
    return schema.parse(localStorage.getItem(key));
  }, []);

  const set = useCallback((newValue: TSchema["_output"]) => {
    localStorage.setItem(key, newValue);
  }, []);

  const remove = useCallback(() => {
    localStorage.removeItem(key);
  }, []);

  return { get, set, remove };
};

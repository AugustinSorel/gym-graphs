import { hc } from "hono/client";
import z from "zod";
import { constant } from "@gym-graphs/constants";
import type { Api } from "@gym-graphs/api";
import type { ClientResponse } from "hono/client";

export const api = hc<Api>(constant.url.api, {
  init: { credentials: "include" },
}).api;

export const parseJsonResponse = async <T extends ClientResponse<any>>(
  fetchRes: T | Promise<T>,
) => {
  const res = await fetchRes;

  const text = await res.text();

  if (!res.ok) {
    const errorData = jsonMessageStringSchema.parse(text);

    throw new Error(errorData.message);
  }

  if (!text) {
    return null;
  }

  return JSON.parse(text) as T extends ClientResponse<infer U> ? U : never;
};

const jsonMessageStringSchema = z
  .preprocess(
    (raw) => {
      if (typeof raw !== "string") {
        return raw;
      }

      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    },
    z.object({ message: z.string() }),
  )
  .catch({ message: "Unknown error" });

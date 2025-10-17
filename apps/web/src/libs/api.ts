import { DetailedError, hc, parseResponse } from "hono/client";
import z from "zod";
import { constant } from "@gym-graphs/constants";
import type { Api } from "@gym-graphs/api";
import type { ClientResponse } from "hono/client";

export const api = hc<Api>(constant.url.api, {
  init: { credentials: "include" },
}).api;

export const parseJsonResponse = async <T extends ClientResponse<any>>(
  req: T | Promise<T>,
) => {
  try {
    return await parseResponse(req);
  } catch (e) {
    if (e instanceof DetailedError) {
      const msg = detailsErrorSchema.catch(e.message).parse(e.detail);

      throw new Error(msg, { cause: e });
    }

    throw e;
  }
};

const detailsErrorSchema = z
  .object({
    data: z.object({
      message: z.string(),
    }),
  })
  .transform((err) => err.data.message);

import { DetailedError, hc, parseResponse } from "hono/client";
import z from "zod";
import { constant } from "@gym-graphs/constants";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import type { Api } from "@gym-graphs/api";
import type { ClientRequestOptions, ClientResponse } from "hono/client";

export const api = () => {
  const options = getOptions();

  return hc<Api>(constant.url.api, options).api;
};

const getOptions = createIsomorphicFn()
  .client((): ClientRequestOptions => {
    return {
      init: { credentials: "include" },
    };
  })
  .server((): ClientRequestOptions => {
    const session = getCookie(constant.cookie.session);

    return {
      headers: { Cookie: `session=${session}` },
    };
  });

export const parseJsonResponse = async <T extends ClientResponse<any>>(
  req: T | Promise<T>,
) => {
  try {
    return await parseResponse(req);
  } catch (e) {
    console.error(e, "<<<<");
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

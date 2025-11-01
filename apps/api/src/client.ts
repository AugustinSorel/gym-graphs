import { DetailedError, hc, parseResponse } from "hono/client";
import { z } from "zod";
import { constant } from "@gym-graphs/constants";
import type { Api } from "~/index";
import type {
  ClientRequestOptions,
  ClientResponse,
  InferRequestType,
} from "hono/client";

export const api = (options: ClientRequestOptions) => {
  return hc<Api>(constant.url.api, options).api;
};

export type ApiReqOption = Parameters<typeof api>[0];

export type InferApiReqInput<T> = InferRequestType<T>;

export const parseJsonResponse = async <T extends ClientResponse<any>>(
  req: T | Promise<T>,
): ApiResponse<T> => {
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

//forcing tsup to bundle the return type of parseResponse as hono does not export it
type ApiResponse<T extends ClientResponse<any>> = ReturnType<
  typeof parseResponse<T>
>;

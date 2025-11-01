import { constant } from "@gym-graphs/constants";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { api as gymGraphsApi } from "@gym-graphs/api";
import type { ApiReqOption } from "@gym-graphs/api";

export const api = () => {
  return gymGraphsApi(getOptions());
};

const getOptions = createIsomorphicFn()
  .client((): ApiReqOption => {
    return {
      init: { credentials: "include" },
    };
  })
  .server((): ApiReqOption => {
    const session = getCookie(constant.cookie.session);

    return {
      headers: { Cookie: `session=${session}` },
    };
  });

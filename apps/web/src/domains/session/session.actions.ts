import { createServerFn } from "@tanstack/react-start";
import { parseResponse } from "hono/client";
import { api } from "~/libs/api";
import { getCookie } from "@tanstack/react-start/server";
import { constant } from "@gym-graphs/constants";

export const fetchSessionActions = createServerFn({ method: "GET" }).handler(
  async ({ signal }) => {
    const session = getCookie(constant.cookie.session);

    const req = api.sessions.me.$get(undefined, {
      headers: { Cookie: `session=${session}` },
      init: { signal },
    });

    return parseResponse(req).catch(() => null);
  },
);

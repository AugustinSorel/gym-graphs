import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense, type PropsWithChildren } from "react";
import appCss from "~/styles/styles.css?url";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { validateRequest } from "~/features/auth/auth.middlewares";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
        })),
      );

const getValidateRequest = createServerFn({ method: "GET" })
  .middleware([validateRequest])
  .handler(({ context }) => {
    return {
      user: context.user,
      session: context.session,
    };
  });

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  beforeLoad: async () => {
    const { user, session } = await getValidateRequest();

    return {
      user,
      session,
    };
  },
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument(props: Readonly<PropsWithChildren>) {
  return (
    <html>
      <head>
        <Meta />
      </head>
      <body>
        {props.children}
        <ReactQueryDevtools buttonPosition="bottom-left" />

        <Suspense>
          <TanStackRouterDevtools position="bottom-right" />
        </Suspense>

        <ScrollRestoration />

        <Scripts />
      </body>
    </html>
  );
}

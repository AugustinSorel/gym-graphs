import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense, type PropsWithChildren } from "react";
import appCss from "~/styles/styles.css?url";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { validateRequest } from "~/auth/auth.middlewares";
import { QueryClient } from "@tanstack/react-query";
import { UserProvider } from "~/context/user.context";
import { Header } from "~/components/header";
import { DefaultErrorFallback } from "~/components/default-error-fallback";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
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
    errorComponent: (props) => DefaultErrorFallback(props),
    beforeLoad: async () => {
      const { user, session } = await getValidateRequest();

      return {
        user,
        session,
      };
    },
    loader: ({ context }) => {
      return {
        user: context.user,
      };
    },
  },
);

function RootComponent() {
  const loaderData = Route.useLoaderData();

  if (!loaderData.user) {
    return (
      <RootDocument>
        <Outlet />
      </RootDocument>
    );
  }

  return (
    <UserProvider user={loaderData.user}>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </UserProvider>
  );
}

function RootDocument(props: Readonly<PropsWithChildren>) {
  const loaderData = Route.useLoaderData();

  return (
    <html>
      <head>
        <Meta />
      </head>
      <body className="bg-background text-foreground">
        {loaderData.user && <Header />}

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

//BUG: error handling not finished

//TODO: dashboard view layout
//TODO: change weight lifted
//TODO: change repetitiosn
//TODO: change done at
//TODO: delete set
//TODO: add weight unit
//TODO: dark theme
//TODO: analytics
//TODO: analytics events
//TODO: monitoring
//TODO: rate limiter
//TODO: docker
//TODO: deploy to vps
//TODO: mobile nav bar
//TODO: mobile exercise page

//TODO: infite scroll for exercises
//TODO: custom exercises filters
//TODO: good auth
//TODO: weight unit
//TODO: teams
//TODO: dashboard fun facts
//TODO: dashboard heat map
//TODO: dashboard exercises count
//TODO: reorder dashboard grid

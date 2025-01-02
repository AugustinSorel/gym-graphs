import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { createServerFn, Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense, type PropsWithChildren } from "react";
import appCss from "~/features/styles/styles.css?url";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { validateRequest } from "~/features/auth/auth.middlewares";
import { QueryClient } from "@tanstack/react-query";
import { UserProvider } from "~/features/context/user.context";
import { Header } from "~/features/components/header";

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
    notFoundComponent: () => {
      return <p>404</p>;
    },
  },
);

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
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
        {loaderData.user && (
          <UserProvider user={loaderData.user}>
            <Header />
          </UserProvider>
        )}
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

//TODO: dark theme
//TODO: error boundary
//TODO: 404 page
//TODO: analytics
//TODO: monitoring
//TODO: rate limiter
//TODO: docker
//TODO: deploy to vps

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
import { UserProvider } from "~/user/user.context";
import { HeaderPrivate, HeaderPublic } from "~/components/header";
import { DefaultErrorFallback } from "~/components/default-error-fallback";

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/router-devtools").then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

const AnalyticScript = () => {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  return (
    <script
      defer
      src="https://analytics.augustin-sorel.com/script.js"
      data-website-id="b60bb4f0-344d-4896-94af-3aebcb6b295e"
    />
  );
};

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
          title: "Gym Graphs",
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
        <AnalyticScript />
      </head>
      <body className="bg-background text-foreground">
        {loaderData.user ? <HeaderPrivate /> : <HeaderPublic />}

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

//TODO: dark theme
//BUG: remove padding in advanced graph
//BUG: header on mobile moves up and down

//BUG: middleware inject code into client bundler
//TODO: monitoring
//TODO: rate limiter
//TODO: inject db in global ctx

//TODO: infite scroll for exercises
//TODO: custom exercises filters
//TODO: good auth
//TODO: teams
//TODO: dashboard fun facts
//TODO: dashboard heat map
//TODO: dashboard exercises count
//TODO: reorder dashboard grid

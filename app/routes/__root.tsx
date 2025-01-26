import {
  Outlet,
  ScrollRestoration,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { Meta, Scripts } from "@tanstack/start";
import { lazy, Suspense } from "react";
import appCss from "~/styles/styles.css?url";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeaderPrivate, HeaderPublic } from "~/components/header";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { ThemeProvider } from "~/theme/theme.context";
import { userKey } from "~/user/user.key";
import { selectSessionTokenAction } from "~/auth/auth.actions";
import type { PropsWithChildren } from "react";
import type { QueryClient } from "@tanstack/react-query";

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
    component: () => RootComponent(),
    errorComponent: (props) => DefaultErrorFallback(props),
    beforeLoad: async ({ context }) => {
      const session = await selectSessionTokenAction();

      if (!session?.user?.emailVerifiedAt) {
        return {
          session: null,
        };
      }

      await context.queryClient.ensureQueryData(userKey.get);

      return {
        session,
        user: session.user,
      };
    },
    loader: ({ context }) => {
      return {
        user: context.session?.user,
      };
    },
  },
);

const RootComponent = () => {
  return (
    <ThemeProvider>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  );
};

const RootDocument = (props: Readonly<PropsWithChildren>) => {
  const loaderData = Route.useLoaderData();

  return (
    <html suppressHydrationWarning>
      <head>
        <Meta />
        <AnalyticScript />
      </head>
      <body className="bg-background text-foreground">
        {loaderData.user?.emailVerifiedAt ? (
          <HeaderPrivate />
        ) : (
          <HeaderPublic />
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
};

//BUG: error handling not finished
//BUG: dev docker not working
//BUG: middleware inject code into client bundler
//TODO: monitoring
//TODO: rate limiter
//TODO: inject db in global ctx
//TODO: remove window.location.herf in github-sign-in.tsx

//BUG: header on mobile moves up and down
//TODO: allow multiple sets
//TODO: infite scroll for exercises
//TODO: teams
//TODO: dashboard heat map
//TODO: reorder dashboard grid
//TODO: add limit
//TODO: readme
//TODO: tags pie

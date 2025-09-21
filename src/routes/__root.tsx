/// <reference types="vite/client" />
import appCss from "~/styles/styles.css?url";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeaderPrivate, HeaderPublic } from "~/components/header";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { ThemeProvider } from "~/theme/theme.context";
import { userQueries } from "~/user/user.queries";
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
        {
          name: "keywords",
          content: "gym, gym graphs, gym monitor, gym tracker",
        },
        {
          name: "description",
          content:
            "Monitor your gym progress with the help of powerfull graphs",
        },
      ],
      links: [{ rel: "stylesheet", href: appCss }],
    }),
    component: () => RootComponent(),
    errorComponent: (props) => DefaultErrorFallback(props),
    beforeLoad: async ({ context }) => {
      const session = await selectSessionTokenAction();

      if (!session?.user) {
        return {
          session: null,
        };
      }

      await context.queryClient.ensureQueryData(userQueries.get);

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
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

        <Scripts />
      </body>
    </html>
  );
};

/*
# TANSTACK BUGS
| Type     | Description                                           |
| -------- | ------------------------------------------------------|
| BUG      | createServerFn cannot be run in tests file            |
| BUG      | tanstack router can't redirect to external url        |
|          | (Remove `window.location.href` in `github-sign-in`)   |
| BUG      | Error boundaries not working properly                 |
|          | (test error boundaries + components again)            |
| BUG      | Dev Docker not working due to vinxi???                |

# APP TAKS
| Type     | Description                                           |
| ---------| ------------------------------------------------------|
| TODO     | branded types                                         |
| TODO     | change @tanstack/react-router-with-query              |
| TODO     | remove useQueryClient                                 |
| TODO     | create better input for creating new sets             |
| TODO     | gamification                                          |
| TODO     | monitoring                                            |
*/

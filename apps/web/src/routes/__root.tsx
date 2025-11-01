/// <reference types="vite/client" />
import appCss from "~/styles/styles.css?url";
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "~/theme/theme.context";
import { userQueries } from "~/domains/user/user.queries";
import { HeaderPrivate, HeaderPublic } from "~/header";
import { api, parseJsonResponse } from "~/libs/api";
import type { RouterCtx } from "~/router";
import type { PropsWithChildren } from "react";

export const Route = createRootRouteWithContext<RouterCtx>()({
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
        content: "Monitor your gym progress with the help of powerfull graphs",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
  onCatch(error) {
    console.log(error);
  },
  beforeLoad: async ({ context }) => {
    const req = api().sessions.me.$get;

    const session = await parseJsonResponse(req()).catch(() => null);

    if (!session) {
      return {
        user: null,
      };
    }

    await context.queryClient.ensureQueryData(userQueries.get);

    return {
      user: session.user,
    };
  },
  loader: ({ context }) => {
    return {
      user: context.user,
    };
  },
});

function RootComponent() {
  return (
    <ThemeProvider>
      <RootDocument>
        <Outlet />
      </RootDocument>
    </ThemeProvider>
  );
}

function RootDocument({ children }: Readonly<PropsWithChildren>) {
  const data = Route.useLoaderData();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <AnalyticScript />
      </head>
      <body className="bg-background text-foreground">
        {!!data.user?.emailVerifiedAt ? <HeaderPrivate /> : <HeaderPublic />}

        {children}

        <Scripts />
        <TanStackRouterDevtools position="bottom-right" />
        <ReactQueryDevtools buttonPosition="bottom-left" />
      </body>
    </html>
  );
}

const AnalyticScript = () => {
  if (!import.meta.env.PROD) {
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
/*
# TANSTACK BUGS
| Type     | Description                                           |
| -------- | ------------------------------------------------------|
| BUG      | tanstack router can't redirect to external url        |
|          | (Remove `window.location.href` in `github-sign-in`)   |

# APP TAKS
| Type     | Description                                           |
| ---------| ------------------------------------------------------|
| TODO     | better api error handling                             |
| TODO     | better web error handling                             |
| TODO     | uninstall hono from web                               |
| TODO     | make tile reordering less laggy                       |
| TODO     | try never throw to clean up api code                  |
*/

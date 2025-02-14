import { createFileRoute } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { permissions } from "~/libs/permissions";

export const Route = createFileRoute("/(teams)/teams")({
  component: () => RouteComponent(),
  errorComponent: (props) => DefaultErrorFallback(props),
  beforeLoad: async ({ context }) => {
    const user = permissions.team.view(context.user);

    return {
      user,
    };
  },
});

const RouteComponent = () => {
  return (
    <main className="mx-10 my-32 flex flex-col items-center gap-2">
      <Construction className="text-accent-foreground size-32 opacity-30" />
      <h1 className="text-accent-foreground text-5xl font-semibold capitalize opacity-30">
        in progress
      </h1>
    </main>
  );
};

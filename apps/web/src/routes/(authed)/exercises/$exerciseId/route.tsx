import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Schema } from "effect";

export const Route = createFileRoute("/(authed)/exercises/$exerciseId")({
  params: {
    parse: (e) =>
      Schema.decodeUnknownSync(
        Schema.Struct({
          exerciseId: Schema.NumberFromString,
        }),
      )(e),
    stringify: (e) => ({
      exerciseId: String(e.exerciseId),
    }),
  },
  component: () => <Outlet />,
});

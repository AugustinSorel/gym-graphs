import { createFileRoute } from "@tanstack/react-router";
import z from "zod";

export const Route = createFileRoute("/(exercises)/exercises/$exerciseId")({
  params: z.object({
    exerciseId: z.coerce.number(),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/(exercises)/exercises/$exerciseId"!</div>;
}

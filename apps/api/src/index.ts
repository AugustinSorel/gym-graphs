import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { ServerLive } from "#/server";

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);

import { NodeRuntime } from "@effect/platform-node";
import { Layer } from "effect";
import { ServerLive } from "#/server";

NodeRuntime.runMain(Layer.launch(ServerLive));

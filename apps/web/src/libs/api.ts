import { hc, InferResponseType } from "hono/client";
import type { Api } from "@gym-graphs/api";

//FIX:this
export const api = hc<Api>("localhost:5000").api;

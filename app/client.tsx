/// <reference types="vinxi/types/client" />
import { scan } from "react-scan";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "~/router";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  scan();
}
const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);

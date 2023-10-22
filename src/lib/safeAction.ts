import { getServerSession } from "next-auth";
import { createSafeActionClient } from "next-safe-action";
import { authOptions } from "./auth";

export class ServerActionError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export const privateAction = createSafeActionClient({
  middleware: async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user.id) {
      throw new ServerActionError("not signed in");
    }

    return {
      userId: session.user.id,
    };
  },
  handleReturnedServerError: (e) => {
    if (e instanceof ServerActionError) {
      return {
        serverError: e.message,
      };
    }

    return {
      serverError: "unandled server error",
    };
  },
});

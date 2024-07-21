import { exerciseRouter } from "./routers/exercise.router";
import { exerciseDataRouter } from "./routers/exerciseData.router";
import { userRouter } from "./routers/user.router";
import { teamRouter } from "./routers/team.router";
import { createTRPCRouter, createCallerFactory } from "./trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  exercise: exerciseRouter,
  exerciseData: exerciseDataRouter,
  team: teamRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

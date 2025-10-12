import { postRouter } from "@/server/api/routers/post";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { requestsRouter } from "./routers/requests";
import { clustersRouter } from "./routers/clusters";
import { gravesRouter } from "./routers/graves";
import { searchRouter } from "./routers/search";
import { instructionsRouter } from "./routers/instructions";
import { publicRouter } from "./routers/public";
import { graveRelationsRouter } from "./routers/graveRelations";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  requests: requestsRouter,
  clusters: clustersRouter,
  graves: gravesRouter,
  search: searchRouter,
  instructions: instructionsRouter,
  public: publicRouter,
  graveRelations: graveRelationsRouter,
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

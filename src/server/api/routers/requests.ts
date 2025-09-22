import { adminProcedure, createTRPCRouter } from "../trpc";




export const requestsRouter = createTRPCRouter({
    listAll: adminProcedure.query(async ({ ctx }) => {
        const requests = await ctx.db.query.request.findMany({
            with: {
                status: true,
                graveDetails: true,
            },
        });
        return requests;
    }),
})
import { request, user } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { eq } from "drizzle-orm";




export const requestsRouter = createTRPCRouter({
    listAll: authenticatedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                requestId: request.id,
                userId: request.userId,
                requestDetails: request.requestDetails,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role,
            })
            .from(request)
            .leftJoin(user, eq(request.userId, user.id));

        return rows;
    }),
})
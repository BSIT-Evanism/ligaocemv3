import { graveCluster, request, user } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";




export const clustersRouter = createTRPCRouter({
    listAll: authenticatedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select()
            .from(graveCluster);

        return rows;
    }),
    create: adminProcedure.input(z.object({
        name: z.string(),
        clusterNumber: z.number(),
        coordinates: z.object({
            latitude: z.number(),
            longitude: z.number(),
        }),
    })).mutation(async ({ ctx, input }) => {
        const row = await ctx.db.insert(graveCluster).values({
            id: crypto.randomUUID(),
            name: input.name,
            clusterNumber: input.clusterNumber,
            coordinates: {
                latitude: input.coordinates.latitude,
                longitude: input.coordinates.longitude,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();
        return row;
    }),
    delete: adminProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(graveCluster).where(eq(graveCluster.id, input.id));
        return { success: true };
    }),
})
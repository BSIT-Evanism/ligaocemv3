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
    getById: authenticatedProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select()
            .from(graveCluster)
            .where(eq(graveCluster.id, input.id));
        return rows[0] ?? null;
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
    update: adminProcedure.input(z.object({
        id: z.string(),
        name: z.string(),
        clusterNumber: z.number(),
    })).mutation(async ({ ctx, input }) => {
        const updated = await ctx.db
            .update(graveCluster)
            .set({
                name: input.name,
                clusterNumber: input.clusterNumber,
                updatedAt: new Date(),
            })
            .where(eq(graveCluster.id, input.id))
            .returning();
        return updated[0] ?? null;
    }),
    delete: adminProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(graveCluster).where(eq(graveCluster.id, input.id));
        return { success: true };
    }),
})
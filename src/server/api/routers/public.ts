import { graveCluster, graveDetails, clusterInstructions, clusterInstructionSteps, gravePicture } from "@/server/db/schema";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const publicRouter = createTRPCRouter({
    clusters: publicProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select()
            .from(graveCluster);

        return rows;
    }),
    gravesByCluster: publicProcedure.input(z.object({ clusterId: z.string() })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select()
            .from(graveDetails)
            .where(eq(graveDetails.graveClusterId, input.clusterId));
        return rows;
    }),
    instructionsByCluster: publicProcedure.input(z.object({ clusterId: z.string() })).query(async ({ ctx, input }) => {
        const instruction = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);
        if (instruction.length === 0) return null;
        const instructionData = instruction[0];
        const steps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionData.id))
            .orderBy(clusterInstructionSteps.step);
        return { ...instructionData, steps };
    }),
    graveImages: publicProcedure.input(z.object({ graveId: z.string() })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select()
            .from(gravePicture)
            .where(eq(gravePicture.graveDetailsId, input.graveId));
        return rows;
    }),

    // Public search function - only searches graves, not requests
    search: publicProcedure
        .input(
            z.object({
                query: z.string().min(1),
                limit: z.number().min(1).max(1000).default(50),
                offset: z.number().min(0).default(0),
            })
        )
        .query(async ({ ctx, input }) => {
            const { query, limit, offset } = input;
            const searchLower = query.toLowerCase();

            // Get all graves and filter on the server side
            const allGraves = await ctx.db
                .select()
                .from(graveDetails);

            // Filter results based on search criteria
            const filteredResults = allGraves.filter((grave) => {
                const graveData = grave.graveJson as Record<string, unknown>;

                return (
                    (graveData.deceasedName as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.plotNumber as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.graveType as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.notes as string)?.toLowerCase().includes(searchLower)
                );
            });

            // Apply pagination
            const paginatedResults = filteredResults.slice(offset, offset + limit);

            return {
                results: paginatedResults,
                total: filteredResults.length,
                hasMore: paginatedResults.length === limit,
            };
        }),
});



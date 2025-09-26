import { graveDetails } from "@/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const gravesRouter = createTRPCRouter({
    listAll: authenticatedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select()
            .from(graveDetails);

        return rows;
    }),

    listByCluster: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
    })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select()
            .from(graveDetails)
            .where(eq(graveDetails.graveClusterId, input.clusterId));

        return rows;
    }),

    create: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
        deceasedName: z.string(),
        birthDate: z.string().optional(),
        deathDate: z.string().optional(),
        graveType: z.string(),
        plotNumber: z.string(),
        notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const graveData = {
            deceasedName: input.deceasedName,
            birthDate: input.birthDate,
            deathDate: input.deathDate,
            graveType: input.graveType,
            plotNumber: input.plotNumber,
            notes: input.notes,
        };

        const row = await ctx.db.insert(graveDetails).values({
            id: crypto.randomUUID(),
            graveClusterId: input.clusterId,
            graveJson: graveData,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return row;
    }),

    update: authenticatedProcedure.input(z.object({
        id: z.string(),
        deceasedName: z.string().optional(),
        birthDate: z.string().optional(),
        deathDate: z.string().optional(),
        graveType: z.string().optional(),
        plotNumber: z.string().optional(),
        notes: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;

        // Get existing grave data
        const existingGrave = await ctx.db
            .select()
            .from(graveDetails)
            .where(eq(graveDetails.id, id))
            .limit(1);

        if (existingGrave.length === 0) {
            throw new Error("Grave not found");
        }

        const currentGraveData = (existingGrave[0]?.graveJson as Record<string, unknown>) ?? {};
        const updatedGraveData = { ...currentGraveData, ...updateData };

        const row = await ctx.db
            .update(graveDetails)
            .set({
                graveJson: updatedGraveData,
                updatedAt: new Date(),
            })
            .where(eq(graveDetails.id, id))
            .returning();

        return row;
    }),

    delete: authenticatedProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(graveDetails).where(eq(graveDetails.id, input.id));
        return { success: true };
    }),
});

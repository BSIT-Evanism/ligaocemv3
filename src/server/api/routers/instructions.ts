import { clusterInstructions, clusterInstructionSteps } from "@/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Ensure uploads directory exists
const ensureUploadsDir = async () => {
    const uploadsDir = join(process.cwd(), "public", "uploads", "instructions");
    if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
    }
    return uploadsDir;
};

// Save base64 image to local storage
const saveImage = async (base64Data: string, filename: string): Promise<string> => {
    const uploadsDir = await ensureUploadsDir();

    // Remove data URL prefix
    const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64String, "base64");

    const filePath = join(uploadsDir, filename);
    await writeFile(filePath, buffer);

    return `/uploads/instructions/${filename}`;
};

export const instructionsRouter = createTRPCRouter({
    // Get instructions for a specific cluster
    getByCluster: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
    })).query(async ({ ctx, input }) => {
        const instruction = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);

        if (instruction.length === 0) {
            return null;
        }

        const steps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instruction[0].id))
            .orderBy(clusterInstructionSteps.step);

        return {
            ...instruction[0],
            steps,
        };
    }),

    // Create or update instructions for a cluster
    upsert: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
        steps: z.array(z.object({
            id: z.string().optional(),
            step: z.number(),
            title: z.string(),
            description: z.string(),
            image: z.string().optional(),
        })),
    })).mutation(async ({ ctx, input }) => {
        // Check if instructions already exist for this cluster
        const existingInstructions = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);

        let instructionId: string;

        if (existingInstructions.length > 0) {
            // Update existing instructions
            instructionId = existingInstructions[0].id;

            // Delete existing steps
            await ctx.db
                .delete(clusterInstructionSteps)
                .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionId));
        } else {
            // Create new instructions
            const newInstruction = await ctx.db
                .insert(clusterInstructions)
                .values({
                    id: crypto.randomUUID(),
                    graveClusterId: input.clusterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            instructionId = newInstruction[0].id;
        }

        // Process and save steps
        const processedSteps = await Promise.all(
            input.steps.map(async (step, index) => {
                let imageUrl: string | null = null;

                if (step.image && step.image.startsWith('data:image/')) {
                    // Save image to local storage
                    const filename = `${instructionId}_step_${index + 1}_${Date.now()}.jpg`;
                    imageUrl = await saveImage(step.image, filename);
                }

                return {
                    id: crypto.randomUUID(),
                    step: index + 1,
                    instruction: `${step.title}\n\n${step.description}`,
                    imageUrl,
                    clusterInstructionsId: instructionId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            })
        );

        // Insert new steps
        const insertedSteps = await ctx.db
            .insert(clusterInstructionSteps)
            .values(processedSteps)
            .returning();

        return {
            instructionId,
            steps: insertedSteps,
        };
    }),

    // Delete instructions for a cluster
    delete: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Get instruction ID
        const instruction = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);

        if (instruction.length === 0) {
            throw new Error("Instructions not found");
        }

        // Delete steps first (cascade should handle this, but being explicit)
        await ctx.db
            .delete(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instruction[0].id));

        // Delete instruction
        await ctx.db
            .delete(clusterInstructions)
            .where(eq(clusterInstructions.id, instruction[0].id));

        return { success: true };
    }),

    // Get all instructions (for admin purposes)
    listAll: authenticatedProcedure.query(async ({ ctx }) => {
        const instructions = await ctx.db
            .select()
            .from(clusterInstructions);

        const instructionsWithSteps = await Promise.all(
            instructions.map(async (instruction) => {
                const steps = await ctx.db
                    .select()
                    .from(clusterInstructionSteps)
                    .where(eq(clusterInstructionSteps.clusterInstructionsId, instruction.id))
                    .orderBy(clusterInstructionSteps.step);

                return {
                    ...instruction,
                    steps,
                };
            })
        );

        return instructionsWithSteps;
    }),
});

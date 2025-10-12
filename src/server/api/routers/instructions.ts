import { clusterInstructions, clusterInstructionSteps } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { utapi } from "@/server/uploadthing";

export const instructionsRouter = createTRPCRouter({
    // Test endpoint to check database schema
    testSchema: authenticatedProcedure.query(async ({ ctx }) => {
        try {
            const result = await ctx.db
                .select({
                    id: clusterInstructionSteps.id,
                    imageCustomId: clusterInstructionSteps.imageCustomId
                })
                .from(clusterInstructionSteps)
                .limit(1);

            return {
                success: true,
                message: "Schema is correct",
                sampleData: result[0] ?? "No data found"
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
                message: "Schema issue detected"
            };
        }
    }),

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

        const instructionData = instruction[0];
        if (!instructionData) {
            return null;
        }

        const steps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionData.id))
            .orderBy(clusterInstructionSteps.step);

        return {
            ...instructionData,
            steps,
        };
    }),

    // Create or get instruction record for a cluster
    getOrCreateInstruction: authenticatedProcedure.input(z.object({
        clusterId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const existingInstruction = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);

        if (existingInstruction.length > 0) {
            return existingInstruction[0];
        }

        // Create new instruction record
        const newInstruction = await ctx.db
            .insert(clusterInstructions)
            .values({
                id: crypto.randomUUID(),
                graveClusterId: input.clusterId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return newInstruction[0];
    }),

    // Add a new step to instructions
    addStep: adminProcedure.input(z.object({
        clusterId: z.string(),
        title: z.string(),
        description: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Get or create instruction record
        const instruction = await ctx.db
            .select()
            .from(clusterInstructions)
            .where(eq(clusterInstructions.graveClusterId, input.clusterId))
            .limit(1);

        let instructionId: string;
        if (instruction.length > 0) {
            instructionId = instruction[0]?.id ?? '';
        } else {
            const newInstruction = await ctx.db
                .insert(clusterInstructions)
                .values({
                    id: crypto.randomUUID(),
                    graveClusterId: input.clusterId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();
            instructionId = newInstruction[0]?.id ?? '';
        }

        // Get current step count
        const existingSteps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionId));

        const stepNumber = existingSteps.length + 1;

        // Create new step
        const newStep = await ctx.db
            .insert(clusterInstructionSteps)
            .values({
                id: crypto.randomUUID(),
                step: stepNumber,
                instruction: `${input.title}\n\n${input.description}`,
                imageUrl: null,
                imageCustomId: null,
                clusterInstructionsId: instructionId,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning();

        return newStep[0];
    }),

    // Update a step
    updateStep: adminProcedure.input(z.object({
        stepId: z.string(),
        title: z.string(),
        description: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const updatedStep = await ctx.db
            .update(clusterInstructionSteps)
            .set({
                instruction: `${input.title}\n\n${input.description}`,
                updatedAt: new Date(),
            })
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .returning();

        return updatedStep[0];
    }),

    // Delete a step
    deleteStep: adminProcedure.input(z.object({
        stepId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Get step to delete its image if it has one
        const step = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .limit(1);

        if (step.length > 0 && step[0]?.imageUrl) {
            try {
                // Extract file key from UploadThing URL
                const url = new URL(step[0].imageUrl);
                const fileKey = url.pathname.split('/').pop();
                if (fileKey) {
                    await utapi.deleteFiles([fileKey]);
                }
            } catch (error) {
                console.error("Failed to delete image from UploadThing:", error);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete the step
        await ctx.db
            .delete(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId));

        return { success: true };
    }),

    // Upload image for a step
    uploadStepImage: adminProcedure.input(z.object({
        stepId: z.string(),
        imageUrl: z.string(), // UploadThing URL
    })).mutation(async ({ ctx, input }) => {
        // Get step info
        const step = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .limit(1);

        if (step.length === 0) {
            throw new Error("Step not found");
        }

        const stepData = step[0];
        if (!stepData) {
            throw new Error("Invalid step data");
        }

        // Delete existing image if any
        if (stepData.imageUrl) {
            try {
                // Extract file key from UploadThing URL
                const url = new URL(stepData.imageUrl);
                const fileKey = url.pathname.split('/').pop();
                if (fileKey) {
                    await utapi.deleteFiles([fileKey]);
                }
            } catch (error) {
                console.error("Failed to delete existing image from UploadThing:", error);
                // Continue with update even if deletion fails
            }
        }

        // Generate custom ID for tracking
        const customId = `step_${input.stepId}_${Date.now()}`;

        // Update step with new image
        const updatedStep = await ctx.db
            .update(clusterInstructionSteps)
            .set({
                imageUrl: input.imageUrl,
                imageCustomId: customId,
                updatedAt: new Date(),
            })
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .returning();

        return updatedStep[0];
    }),

    // Remove image from a step
    removeStepImage: adminProcedure.input(z.object({
        stepId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Get step info
        const step = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .limit(1);

        if (step.length === 0) {
            throw new Error("Step not found");
        }

        const stepData = step[0];
        if (!stepData) {
            throw new Error("Invalid step data");
        }

        // Delete image file from UploadThing if exists
        if (stepData.imageUrl) {
            try {
                // Extract file key from UploadThing URL
                const url = new URL(stepData.imageUrl);
                const fileKey = url.pathname.split('/').pop();
                if (fileKey) {
                    await utapi.deleteFiles([fileKey]);
                }
            } catch (error) {
                console.error("Failed to delete image from UploadThing:", error);
                // Continue with database update even if file deletion fails
            }
        }

        // Update step to remove image
        const updatedStep = await ctx.db
            .update(clusterInstructionSteps)
            .set({
                imageUrl: null,
                imageCustomId: null,
                updatedAt: new Date(),
            })
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .returning();

        return updatedStep[0];
    }),

    // Delete instructions for a cluster
    delete: adminProcedure.input(z.object({
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

        const instructionData = instruction[0];
        if (!instructionData) {
            throw new Error("Invalid instruction data");
        }

        // Get existing steps with images to delete them
        const existingSteps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionData.id));

        // Delete existing images from UploadThing
        const imageUrls = existingSteps
            .filter(step => step.imageUrl)
            .map(step => step.imageUrl!);

        if (imageUrls.length > 0) {
            try {
                const fileKeys = imageUrls
                    .map(url => {
                        try {
                            const urlObj = new URL(url);
                            return urlObj.pathname.split('/').pop();
                        } catch {
                            return null;
                        }
                    })
                    .filter((key): key is string => key !== null);

                if (fileKeys.length > 0) {
                    await utapi.deleteFiles(fileKeys);
                }
            } catch (error) {
                console.error("Failed to delete images from UploadThing:", error);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete steps first (cascade should handle this, but being explicit)
        await ctx.db
            .delete(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionData.id));

        // Delete instruction
        await ctx.db
            .delete(clusterInstructions)
            .where(eq(clusterInstructions.id, instructionData.id));

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

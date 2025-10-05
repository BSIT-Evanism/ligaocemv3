import { clusterInstructions, clusterInstructionSteps } from "@/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";
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

// Save base64 image to local storage with custom ID
const saveImage = async (base64Data: string, customId: string): Promise<{ imageUrl: string, customId: string }> => {
    try {
        console.log('Saving image with custom ID:', customId);
        const uploadsDir = await ensureUploadsDir();
        console.log('Uploads directory:', uploadsDir);

        // Remove data URL prefix
        const base64String = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
        const buffer = Buffer.from(base64String, "base64");

        // Extract file extension from base64 data
        const match = /data:image\/([a-z]+);base64/.exec(base64Data);
        const mimeType = match?.[1] ?? 'jpg';
        const filename = `${customId}.${mimeType}`;

        const filePath = join(uploadsDir, filename);
        console.log('Saving file to:', filePath);
        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/instructions/${filename}`;
        console.log('Image saved successfully:', imageUrl);

        return {
            imageUrl,
            customId
        };
    } catch (error) {
        console.error('Error saving image:', error);
        throw new Error(`Failed to save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

// Delete image by custom ID
const deleteImage = async (customId: string): Promise<void> => {
    if (!customId) {
        console.warn('No custom ID provided for deletion');
        return;
    }

    try {
        const uploadsDir = await ensureUploadsDir();
        // Try to find and delete the file with this custom ID
        const fs = await import('fs/promises');
        const path = await import('path');

        // Look for files with this custom ID (regardless of extension)
        const files = await fs.readdir(uploadsDir);
        const fileToDelete = files.find(file => file.startsWith(customId));

        if (fileToDelete) {
            const filePath = path.join(uploadsDir, fileToDelete);
            await fs.unlink(filePath);
            console.log(`Deleted image: ${fileToDelete}`);
        }
    } catch (error) {
        console.error('Error deleting image:', error);
        // Don't throw error for image deletion failures
    }
};

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
    addStep: authenticatedProcedure.input(z.object({
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
    updateStep: authenticatedProcedure.input(z.object({
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
    deleteStep: authenticatedProcedure.input(z.object({
        stepId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Get step to delete its image if it has one
        const step = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .limit(1);

        if (step.length > 0 && step[0]?.imageCustomId) {
            await deleteImage(step[0].imageCustomId);
        }

        // Delete the step
        await ctx.db
            .delete(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.id, input.stepId));

        return { success: true };
    }),

    // Upload image for a step
    uploadStepImage: authenticatedProcedure.input(z.object({
        stepId: z.string(),
        imageData: z.string(), // base64 data
    })).mutation(async ({ ctx, input }) => {
        if (!input.imageData.startsWith('data:image/')) {
            throw new Error("Invalid image data format");
        }

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
        if (stepData.imageCustomId) {
            await deleteImage(stepData.imageCustomId);
        }

        // Generate custom ID and save image
        const customId = `step_${input.stepId}_${Date.now()}`;
        const result = await saveImage(input.imageData, customId);

        // Update step with new image
        const updatedStep = await ctx.db
            .update(clusterInstructionSteps)
            .set({
                imageUrl: result.imageUrl,
                imageCustomId: result.customId,
                updatedAt: new Date(),
            })
            .where(eq(clusterInstructionSteps.id, input.stepId))
            .returning();

        return updatedStep[0];
    }),

    // Remove image from a step
    removeStepImage: authenticatedProcedure.input(z.object({
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

        // Delete image file if exists
        if (stepData.imageCustomId) {
            await deleteImage(stepData.imageCustomId);
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

        const instructionData = instruction[0];
        if (!instructionData) {
            throw new Error("Invalid instruction data");
        }

        // Get existing steps with images to delete them
        const existingSteps = await ctx.db
            .select()
            .from(clusterInstructionSteps)
            .where(eq(clusterInstructionSteps.clusterInstructionsId, instructionData.id));

        // Delete existing images
        await Promise.all(
            existingSteps
                .filter(step => step.imageCustomId)
                .map(step => deleteImage(step.imageCustomId!))
        );

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

    // Delete individual image by custom ID
    deleteImage: authenticatedProcedure.input(z.object({
        customId: z.string(),
    })).mutation(async ({ input }) => {
        await deleteImage(input.customId);
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

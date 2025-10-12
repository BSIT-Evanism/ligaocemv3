import { graveDetails, gravePicture, graveCluster } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq, and, isNotNull, lt, gte, lte, desc } from "drizzle-orm";
import { utapi } from "@/server/uploadthing";

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

    create: adminProcedure.input(z.object({
        clusterId: z.string(),
        deceasedName: z.string(),
        birthDate: z.string().optional(),
        deathDate: z.string().optional(),
        graveType: z.string(),
        plotNumber: z.string(),
        notes: z.string().optional(),
        graveExpirationDate: z.string().optional(),
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
            graveExpirationDate: input.graveExpirationDate ? new Date(input.graveExpirationDate) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return row;
    }),

    update: adminProcedure.input(z.object({
        id: z.string(),
        deceasedName: z.string().optional(),
        birthDate: z.string().optional(),
        deathDate: z.string().optional(),
        graveType: z.string().optional(),
        plotNumber: z.string().optional(),
        notes: z.string().optional(),
        graveExpirationDate: z.string().optional(),
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
        const { graveExpirationDate, ...jsonUpdateData } = updateData;
        const updatedGraveData = { ...currentGraveData, ...jsonUpdateData };

        const updateFields: any = {
            graveJson: updatedGraveData,
            updatedAt: new Date(),
        };

        if (graveExpirationDate !== undefined) {
            updateFields.graveExpirationDate = graveExpirationDate ? new Date(graveExpirationDate) : null;
        }

        const row = await ctx.db
            .update(graveDetails)
            .set(updateFields)
            .where(eq(graveDetails.id, id))
            .returning();

        return row;
    }),

    delete: adminProcedure.input(z.object({
        id: z.string(),
    })).mutation(async ({ ctx, input }) => {
        await ctx.db.delete(graveDetails).where(eq(graveDetails.id, input.id));
        return { success: true };
    }),

    // List pictures for a grave
    listImages: authenticatedProcedure.input(z.object({
        graveId: z.string(),
    })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select()
            .from(gravePicture)
            .where(eq(gravePicture.graveDetailsId, input.graveId));
        return rows;
    }),

    // Upload a new picture for a grave
    uploadImage: adminProcedure.input(z.object({
        graveId: z.string(),
        imageUrl: z.string(), // UploadThing URL
        imageAlt: z.string().optional(),
        description: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        // Verify grave exists
        const existing = await ctx.db
            .select()
            .from(graveDetails)
            .where(eq(graveDetails.id, input.graveId))
            .limit(1);
        if (existing.length === 0) {
            throw new Error("Grave not found");
        }

        const inserted = await ctx.db.insert(gravePicture).values({
            id: crypto.randomUUID(),
            imageUrl: input.imageUrl,
            imageAlt: input.imageAlt ?? null,
            description: input.description ?? null,
            graveDetailsId: input.graveId,
            createdAt: new Date(),
            updatedAt: new Date(),
        }).returning();

        return inserted[0];
    }),

    // Delete a picture from a grave
    deleteImage: adminProcedure.input(z.object({
        pictureId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        // Find picture
        const rows = await ctx.db
            .select()
            .from(gravePicture)
            .where(eq(gravePicture.id, input.pictureId))
            .limit(1);
        const picture = rows[0];
        if (!picture) {
            throw new Error("Picture not found");
        }

        // Delete file from UploadThing (best-effort)
        if (picture.imageUrl) {
            try {
                // Extract file key from UploadThing URL
                const url = new URL(picture.imageUrl);
                const fileKey = url.pathname.split('/').pop();
                if (fileKey) {
                    await utapi.deleteFiles([fileKey]);
                }
            } catch (error) {
                console.error("Failed to delete file from UploadThing:", error);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete db row
        await ctx.db
            .delete(gravePicture)
            .where(eq(gravePicture.id, input.pictureId));

        return { success: true };
    }),

    // Get graves near expiration (within 30 days)
    getNearExpiration: authenticatedProcedure.query(async ({ ctx }) => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const rows = await ctx.db
            .select({
                id: graveDetails.id,
                graveJson: graveDetails.graveJson,
                graveExpirationDate: graveDetails.graveExpirationDate,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveDetails)
            .innerJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .where(
                and(
                    isNotNull(graveDetails.graveExpirationDate),
                    lte(graveDetails.graveExpirationDate, thirtyDaysFromNow),
                    gte(graveDetails.graveExpirationDate, new Date())
                )
            )
            .orderBy(desc(graveDetails.graveExpirationDate));

        return rows;
    }),

    // Get expired graves
    getExpired: authenticatedProcedure.query(async ({ ctx }) => {
        const now = new Date();

        const rows = await ctx.db
            .select({
                id: graveDetails.id,
                graveJson: graveDetails.graveJson,
                graveExpirationDate: graveDetails.graveExpirationDate,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveDetails)
            .innerJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .where(
                and(
                    isNotNull(graveDetails.graveExpirationDate),
                    lt(graveDetails.graveExpirationDate, now)
                )
            )
            .orderBy(desc(graveDetails.graveExpirationDate));

        return rows;
    }),

    // Get single grave by ID with cluster info
    getById: authenticatedProcedure.input(z.object({
        id: z.string(),
    })).query(async ({ ctx, input }) => {
        const rows = await ctx.db
            .select({
                id: graveDetails.id,
                graveJson: graveDetails.graveJson,
                graveExpirationDate: graveDetails.graveExpirationDate,
                graveClusterId: graveDetails.graveClusterId,
                createdAt: graveDetails.createdAt,
                updatedAt: graveDetails.updatedAt,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveDetails)
            .innerJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .where(eq(graveDetails.id, input.id))
            .limit(1);

        return rows[0] ?? null;
    }),

    // Update grave details (including JSON data and expiration date)
    updateDetails: adminProcedure.input(z.object({
        id: z.string(),
        deceasedName: z.string().optional(),
        birthDate: z.string().optional(),
        deathDate: z.string().optional(),
        graveType: z.string().optional(),
        plotNumber: z.string().optional(),
        notes: z.string().optional(),
        graveExpirationDate: z.string().optional(),
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
        const { graveExpirationDate, ...jsonUpdateData } = updateData;
        const updatedGraveData = { ...currentGraveData, ...jsonUpdateData };

        const updateFields: any = {
            graveJson: updatedGraveData,
            updatedAt: new Date(),
        };

        if (graveExpirationDate !== undefined) {
            updateFields.graveExpirationDate = graveExpirationDate ? new Date(graveExpirationDate) : null;
        }

        const row = await ctx.db
            .update(graveDetails)
            .set(updateFields)
            .where(eq(graveDetails.id, id))
            .returning();

        return row[0];
    }),

    // Get all graves with expiration dates (for admin notifications)
    getExpirationAlerts: adminProcedure.query(async ({ ctx }) => {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const now = new Date();

        const [nearExpiration, expired] = await Promise.all([
            ctx.db
                .select({
                    id: graveDetails.id,
                    graveJson: graveDetails.graveJson,
                    graveExpirationDate: graveDetails.graveExpirationDate,
                    clusterName: graveCluster.name,
                    clusterNumber: graveCluster.clusterNumber,
                })
                .from(graveDetails)
                .innerJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
                .where(
                    and(
                        isNotNull(graveDetails.graveExpirationDate),
                        lte(graveDetails.graveExpirationDate, thirtyDaysFromNow),
                        gte(graveDetails.graveExpirationDate, now)
                    )
                )
                .orderBy(desc(graveDetails.graveExpirationDate)),

            ctx.db
                .select({
                    id: graveDetails.id,
                    graveJson: graveDetails.graveJson,
                    graveExpirationDate: graveDetails.graveExpirationDate,
                    clusterName: graveCluster.name,
                    clusterNumber: graveCluster.clusterNumber,
                })
                .from(graveDetails)
                .innerJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
                .where(
                    and(
                        isNotNull(graveDetails.graveExpirationDate),
                        lt(graveDetails.graveExpirationDate, now)
                    )
                )
                .orderBy(desc(graveDetails.graveExpirationDate))
        ]);

        return {
            nearExpiration,
            expired,
            totalNearExpiration: nearExpiration.length,
            totalExpired: expired.length,
        };
    }),
});

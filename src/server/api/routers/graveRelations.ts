import { graveRelatedUsers, graveDetails, user, graveCluster } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq, and, desc, notExists } from "drizzle-orm";

export const graveRelationsRouter = createTRPCRouter({
    // List all grave-user relationships with full details
    listAll: adminProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                id: graveRelatedUsers.id,
                userId: graveRelatedUsers.userId,
                graveDetailsId: graveRelatedUsers.graveDetailsId,
                createdAt: graveRelatedUsers.createdAt,
                updatedAt: graveRelatedUsers.updatedAt,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role,
                graveJson: graveDetails.graveJson,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveRelatedUsers)
            .leftJoin(user, eq(graveRelatedUsers.userId, user.id))
            .leftJoin(graveDetails, eq(graveRelatedUsers.graveDetailsId, graveDetails.id))
            .leftJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .orderBy(desc(graveRelatedUsers.createdAt));

        return rows;
    }),

    // Get relationships for a specific user
    getByUser: adminProcedure
        .input(z.object({
            userId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const rows = await ctx.db
                .select({
                    id: graveRelatedUsers.id,
                    graveDetailsId: graveRelatedUsers.graveDetailsId,
                    createdAt: graveRelatedUsers.createdAt,
                    updatedAt: graveRelatedUsers.updatedAt,
                    graveJson: graveDetails.graveJson,
                    clusterName: graveCluster.name,
                    clusterNumber: graveCluster.clusterNumber,
                })
                .from(graveRelatedUsers)
                .leftJoin(graveDetails, eq(graveRelatedUsers.graveDetailsId, graveDetails.id))
                .leftJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
                .where(eq(graveRelatedUsers.userId, input.userId))
                .orderBy(desc(graveRelatedUsers.createdAt));

            return rows;
        }),

    // Get relationships for a specific grave
    getByGrave: adminProcedure
        .input(z.object({
            graveDetailsId: z.string(),
        }))
        .query(async ({ ctx, input }) => {
            const rows = await ctx.db
                .select({
                    id: graveRelatedUsers.id,
                    userId: graveRelatedUsers.userId,
                    createdAt: graveRelatedUsers.createdAt,
                    updatedAt: graveRelatedUsers.updatedAt,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                })
                .from(graveRelatedUsers)
                .leftJoin(user, eq(graveRelatedUsers.userId, user.id))
                .where(eq(graveRelatedUsers.graveDetailsId, input.graveDetailsId))
                .orderBy(desc(graveRelatedUsers.createdAt));

            return rows;
        }),

    // Create a new grave-user relationship
    create: adminProcedure
        .input(z.object({
            userId: z.string(),
            graveDetailsId: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Check if relationship already exists
            const existing = await ctx.db
                .select()
                .from(graveRelatedUsers)
                .where(
                    and(
                        eq(graveRelatedUsers.userId, input.userId),
                        eq(graveRelatedUsers.graveDetailsId, input.graveDetailsId)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                throw new Error("This user is already related to this grave");
            }

            const row = await ctx.db
                .insert(graveRelatedUsers)
                .values({
                    id: crypto.randomUUID(),
                    userId: input.userId,
                    graveDetailsId: input.graveDetailsId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return row[0];
        }),

    // Delete a grave-user relationship
    delete: adminProcedure
        .input(z.object({
            id: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(graveRelatedUsers)
                .where(eq(graveRelatedUsers.id, input.id));

            return { success: true };
        }),

    // Get available graves (not related to any user)
    getAvailableGraves: adminProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                id: graveDetails.id,
                graveJson: graveDetails.graveJson,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveDetails)
            .leftJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .where(
                notExists(
                    ctx.db
                        .select()
                        .from(graveRelatedUsers)
                        .where(eq(graveRelatedUsers.graveDetailsId, graveDetails.id))
                )
            )
            .orderBy(graveCluster.name, graveDetails.id);

        return rows;
    }),

    // Get available users (for selection)
    getAvailableUsers: adminProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            })
            .from(user)
            .orderBy(user.name);

        return rows;
    }),

    // Get graves related to the current user
    getMyRelatedGraves: authenticatedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                id: graveDetails.id,
                graveJson: graveDetails.graveJson,
                clusterName: graveCluster.name,
                clusterNumber: graveCluster.clusterNumber,
            })
            .from(graveRelatedUsers)
            .leftJoin(graveDetails, eq(graveRelatedUsers.graveDetailsId, graveDetails.id))
            .leftJoin(graveCluster, eq(graveDetails.graveClusterId, graveCluster.id))
            .where(eq(graveRelatedUsers.userId, ctx.user.id))
            .orderBy(graveCluster.name, graveDetails.id);

        return rows;
    }),
});

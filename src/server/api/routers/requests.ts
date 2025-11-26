import { request, user, requestStatusTable, requestLogs, graveDetails, requestGraveRelation } from "@/server/db/schema";
import { adminProcedure, authenticatedProcedure, createTRPCRouter } from "../trpc";
import { eq, and, desc, count } from "drizzle-orm";
import { z } from "zod";

export const requestsRouter = createTRPCRouter({
    // Admin: List all requests with user details and status (with pagination)
    listAll: adminProcedure
        .input(z.object({
            page: z.number().min(1).default(1),
            limit: z.number().min(1).max(100).default(10),
        }).optional())
        .query(async ({ ctx, input = {} }) => {
            try {
                console.log("listAll query called with input:", input);
                // Use defaults if input is not provided
                const page = input.page ?? 1;
                const limit = input.limit ?? 10;
                const offset = (page - 1) * limit;

                // Get total count for pagination
                const totalCountResult = await ctx.db
                    .select({ count: count() })
                    .from(request)
                    .leftJoin(user, eq(request.userId, user.id))
                    .leftJoin(requestStatusTable, eq(request.id, requestStatusTable.requestId));

                const totalCount = totalCountResult[0]?.count ?? 0;

                // Get paginated data
                const rows = await ctx.db
                    .select({
                        requestId: request.id,
                        userId: request.userId,
                        requestDetails: request.requestDetails,
                        requestRelatedGrave: request.requestRelatedGrave,
                        createdAt: request.createdAt,
                        updatedAt: request.updatedAt,
                        userName: user.name,
                        userEmail: user.email,
                        userRole: user.role,
                        status: requestStatusTable.status,
                        statusRemark: requestStatusTable.remark,
                        statusUpdatedAt: requestStatusTable.updatedAt,
                    })
                    .from(request)
                    .leftJoin(user, eq(request.userId, user.id))
                    .leftJoin(requestStatusTable, eq(request.id, requestStatusTable.requestId))
                    .orderBy(desc(request.createdAt))
                    .limit(limit)
                    .offset(offset);

                // Parse the structured request data
                const data = rows.map(row => ({
                    ...row,
                    requestData: (() => {
                        try {
                            const parsed = JSON.parse(row.requestDetails);
                            return {
                                details: parsed.details || row.requestDetails,
                                priority: parsed.priority || "medium",
                                contactPhone: parsed.contactPhone,
                                preferredContactTime: parsed.preferredContactTime,
                                additionalNotes: parsed.additionalNotes,
                            };
                        } catch {
                            // Fallback for old format
                            return {
                                details: row.requestDetails,
                                priority: "medium",
                                contactPhone: null,
                                preferredContactTime: null,
                                additionalNotes: null,
                            };
                        }
                    })()
                }));

                return {
                    data,
                    pagination: {
                        page: page,
                        limit: limit,
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        hasNext: page < Math.ceil(totalCount / limit),
                        hasPrev: page > 1,
                    }
                };
            } catch (error) {
                console.error("Error in listAll query:", error);
                throw new Error("Failed to fetch requests");
            }
        }),

    // User: List their own requests
    listMyRequests: authenticatedProcedure.query(async ({ ctx }) => {
        const rows = await ctx.db
            .select({
                requestId: request.id,
                requestDetails: request.requestDetails,
                requestRelatedGrave: request.requestRelatedGrave,
                createdAt: request.createdAt,
                updatedAt: request.updatedAt,
                status: requestStatusTable.status,
                statusRemark: requestStatusTable.remark,
                statusUpdatedAt: requestStatusTable.updatedAt,
            })
            .from(request)
            .leftJoin(requestStatusTable, eq(request.id, requestStatusTable.requestId))
            .where(eq(request.userId, ctx.user.id))
            .orderBy(desc(request.createdAt));

        // Parse the structured request data
        return rows.map(row => ({
            ...row,
            requestData: (() => {
                try {
                    const parsed = JSON.parse(row.requestDetails);
                    return {
                        details: parsed.details || row.requestDetails,
                        priority: parsed.priority || "medium",
                        contactPhone: parsed.contactPhone,
                        preferredContactTime: parsed.preferredContactTime,
                        additionalNotes: parsed.additionalNotes,
                    };
                } catch {
                    // Fallback for old format
                    return {
                        details: row.requestDetails,
                        priority: "medium",
                        contactPhone: null,
                        preferredContactTime: null,
                        additionalNotes: null,
                    };
                }
            })()
        }));
    }),

    // Get single request with full details
    getById: authenticatedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const requestData = await ctx.db
                .select({
                    requestId: request.id,
                    userId: request.userId,
                    requestDetails: request.requestDetails,
                    requestRelatedGrave: request.requestRelatedGrave,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                    status: requestStatusTable.status,
                    statusRemark: requestStatusTable.remark,
                    statusUpdatedAt: requestStatusTable.updatedAt,
                })
                .from(request)
                .leftJoin(user, eq(request.userId, user.id))
                .leftJoin(requestStatusTable, eq(request.id, requestStatusTable.requestId))
                .where(eq(request.id, input.id))
                .limit(1);

            if (requestData.length === 0) {
                throw new Error("Request not found");
            }

            const requestItem = requestData[0];
            if (!requestItem) {
                throw new Error("Request not found");
            }

            // Check if user can access this request (own request or admin)
            if (requestItem.userId !== ctx.user.id && ctx.user.role !== "admin") {
                throw new Error("Unauthorized to view this request");
            }

            // Get request logs
            const logs = await ctx.db
                .select({
                    id: requestLogs.id,
                    log: requestLogs.log,
                    createdAt: requestLogs.createdAt,
                    userName: user.name,
                })
                .from(requestLogs)
                .leftJoin(user, eq(requestLogs.userId, user.id))
                .where(eq(requestLogs.requestId, input.id))
                .orderBy(desc(requestLogs.createdAt));

            // Get related grave details if exists
            let relatedGrave = null;
            if (requestItem?.requestRelatedGrave) {
                const graveData = await ctx.db
                    .select()
                    .from(graveDetails)
                    .where(eq(graveDetails.id, requestItem.requestRelatedGrave))
                    .limit(1);
                relatedGrave = graveData[0] || null;
            }

            return {
                ...requestItem,
                logs,
                relatedGrave,
            };
        }),

    // User: Create a new request
    create: authenticatedProcedure
        .input(z.object({
            requestDetails: z.string().min(1, "Request details are required"),
            requestRelatedGrave: z.string().optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            contactPhone: z.string().optional(),
            preferredContactTime: z.string().optional(),
            additionalNotes: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const requestId = crypto.randomUUID();
            const statusId = crypto.randomUUID();

            // Create structured request data with optional fields
            const requestData = {
                details: input.requestDetails,
                priority: input.priority || "medium",
                contactPhone: input.contactPhone || null,
                preferredContactTime: input.preferredContactTime || null,
                additionalNotes: input.additionalNotes || null,
            };

            // Create the request
            await ctx.db.insert(request).values({
                id: requestId,
                userId: ctx.user.id,
                requestDetails: JSON.stringify(requestData),
                requestRelatedGrave: input.requestRelatedGrave || null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Create initial status
            await ctx.db.insert(requestStatusTable).values({
                id: statusId,
                requestId: requestId,
                status: "pending",
                remark: "Request submitted",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Create initial log
            await ctx.db.insert(requestLogs).values({
                id: crypto.randomUUID(),
                requestId: requestId,
                userId: ctx.user.id,
                log: "Request submitted",
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return { success: true, requestId };
        }),

    // Admin: Update request status
    updateStatus: adminProcedure
        .input(z.object({
            requestId: z.string(),
            status: z.enum(["pending", "approved", "rejected", "processing"]),
            remark: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Update or create status
            const existingStatus = await ctx.db
                .select()
                .from(requestStatusTable)
                .where(eq(requestStatusTable.requestId, input.requestId))
                .limit(1);

            if (existingStatus.length > 0) {
                await ctx.db
                    .update(requestStatusTable)
                    .set({
                        status: input.status,
                        remark: input.remark || null,
                        updatedAt: new Date(),
                    })
                    .where(eq(requestStatusTable.requestId, input.requestId));
            } else {
                await ctx.db.insert(requestStatusTable).values({
                    id: crypto.randomUUID(),
                    requestId: input.requestId,
                    status: input.status,
                    remark: input.remark || null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }

            // Add log entry
            await ctx.db.insert(requestLogs).values({
                id: crypto.randomUUID(),
                requestId: input.requestId,
                userId: ctx.user.id,
                log: `Status updated to ${input.status}${input.remark ? `: ${input.remark}` : ""}`,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return { success: true };
        }),

    // Admin: Add log entry
    addLog: adminProcedure
        .input(z.object({
            requestId: z.string(),
            log: z.string().min(1, "Log entry is required"),
        }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.insert(requestLogs).values({
                id: crypto.randomUUID(),
                requestId: input.requestId,
                userId: ctx.user.id,
                log: input.log,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return { success: true };
        }),

    // Admin: Delete request
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            // Delete related records first (cascade should handle this, but being explicit)
            await ctx.db.delete(requestLogs).where(eq(requestLogs.requestId, input.id));
            await ctx.db.delete(requestStatusTable).where(eq(requestStatusTable.requestId, input.id));
            await ctx.db.delete(requestGraveRelation).where(eq(requestGraveRelation.requestId, input.id));

            // Delete the request
            await ctx.db.delete(request).where(eq(request.id, input.id));

            return { success: true };
        }),

    // Get request statistics for admin dashboard
    getStats: adminProcedure.query(async ({ ctx }) => {
        const totalRequests = await ctx.db
            .select({ count: request.id })
            .from(request);

        const statusCounts = await ctx.db
            .select({
                status: requestStatusTable.status,
                count: requestStatusTable.id,
            })
            .from(requestStatusTable)
            .leftJoin(request, eq(requestStatusTable.requestId, request.id));

        const stats = {
            total: totalRequests.length,
            pending: statusCounts.filter(s => s.status === "pending").length,
            approved: statusCounts.filter(s => s.status === "approved").length,
            rejected: statusCounts.filter(s => s.status === "rejected").length,
            processing: statusCounts.filter(s => s.status === "processing").length,
        };

        return stats;
    }),
});
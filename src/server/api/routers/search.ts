/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
import { graveDetails, request, user } from "@/server/db/schema";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { z } from "zod";
import { eq } from "drizzle-orm";

export const searchRouter = createTRPCRouter({
    graves: authenticatedProcedure
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

    requests: authenticatedProcedure
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

            // Get all requests with user data
            const allRequests = await ctx.db
                .select({
                    requestId: request.id,
                    userId: request.userId,
                    requestDetails: request.requestDetails,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                })
                .from(request)
                .leftJoin(user, eq(user.id, request.userId));

            // Filter results based on search criteria
            const filteredResults = allRequests.filter((req) => {
                return (
                    (req.requestDetails?.toLowerCase().includes(searchLower)) ||
                    (req.userName?.toLowerCase().includes(searchLower)) ||
                    (req.userEmail?.toLowerCase().includes(searchLower))
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

    all: authenticatedProcedure
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

            // Search graves
            const allGraves = await ctx.db
                .select()
                .from(graveDetails);

            const filteredGraves = allGraves.filter((grave) => {
                const graveData = grave.graveJson as Record<string, unknown>;

                return (
                    (graveData.deceasedName as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.plotNumber as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.graveType as string)?.toLowerCase().includes(searchLower) ||
                    (graveData.notes as string)?.toLowerCase().includes(searchLower)
                );
            });

            // Search requests
            const allRequests = await ctx.db
                .select({
                    requestId: request.id,
                    userId: request.userId,
                    requestDetails: request.requestDetails,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    userName: user.name,
                    userEmail: user.email,
                    userRole: user.role,
                })
                .from(request)
                .leftJoin(user, eq(user.id, request.userId));

            const filteredRequests = allRequests.filter((req) => {
                return (
                    (req.requestDetails?.toLowerCase().includes(searchLower)) ||
                    (req.userName?.toLowerCase().includes(searchLower)) ||
                    (req.userEmail?.toLowerCase().includes(searchLower))
                );
            });

            // Apply pagination to each category
            const gravesPerPage = Math.ceil(limit / 2);
            const requestsPerPage = Math.ceil(limit / 2);
            const gravesOffset = Math.ceil(offset / 2);
            const requestsOffset = Math.ceil(offset / 2);

            const paginatedGraves = filteredGraves.slice(gravesOffset, gravesOffset + gravesPerPage);
            const paginatedRequests = filteredRequests.slice(requestsOffset, requestsOffset + requestsPerPage);

            return {
                graves: {
                    results: paginatedGraves,
                    total: filteredGraves.length,
                },
                requests: {
                    results: paginatedRequests,
                    total: filteredRequests.length,
                },
                total: filteredGraves.length + filteredRequests.length,
            };
        }),
});

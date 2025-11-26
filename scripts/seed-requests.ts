#!/usr/bin/env tsx

/**
 * Request Seeder Script
 * 
 * This script populates the database with sample request data for testing and development.
 * It creates users, requests, request statuses, and request logs with realistic data.
 * 
 * Usage:
 *   npm run seed:requests
 *   or
 *   tsx scripts/seed-requests.ts
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import {
    user,
    request,
    requestStatusTable,
    requestLogs,
    graveDetails,
    graveCluster
} from "../src/server/db/schema";
import { eq } from "drizzle-orm";

// Load environment variables
config();

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ DATABASE_URL environment variable is required");
    process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

// Sample data generators
const sampleUsers = [
    {
        id: "user-1",
        name: "Maria Santos",
        email: "maria.santos@example.com",
        emailVerified: true,
        role: "user",
        banned: false,
    },
    {
        id: "user-2",
        name: "Juan Dela Cruz",
        email: "juan.delacruz@example.com",
        emailVerified: true,
        role: "user",
        banned: false,
    },
    {
        id: "user-3",
        name: "Ana Rodriguez",
        email: "ana.rodriguez@example.com",
        emailVerified: true,
        role: "user",
        banned: false,
    },
    {
        id: "user-4",
        name: "Carlos Mendoza",
        email: "carlos.mendoza@example.com",
        emailVerified: true,
        role: "user",
        banned: false,
    },
    {
        id: "user-5",
        name: "Elena Garcia",
        email: "elena.garcia@example.com",
        emailVerified: true,
        role: "user",
        banned: false,
    },
    {
        id: "admin-1",
        name: "Admin User",
        email: "admin@ligaocemv3.com",
        emailVerified: true,
        role: "admin",
        banned: false,
    }
];

const requestTypes = [
    "Grave Maintenance Request",
    "New Grave Plot Application",
    "Grave Transfer Request",
    "Memorial Service Request",
    "Grave Decoration Request",
    "Grave Relocation Request",
    "Grave Documentation Request",
    "Grave Access Request"
];

const requestDetails = [
    "I would like to request maintenance for my family's grave plot. The headstone needs cleaning and the surrounding area requires landscaping.",
    "I am applying for a new grave plot for my recently deceased father. We prefer a location near the main entrance.",
    "I need to transfer the ownership of my mother's grave to my sister. Please provide the necessary forms and requirements.",
    "We would like to schedule a memorial service for our grandmother next month. Please let us know available dates and requirements.",
    "I want to add some flowers and decorations to my father's grave. Are there any restrictions on what can be placed?",
    "Due to family circumstances, we need to relocate my brother's grave to a different section. Please advise on the process.",
    "I need official documentation for my family's grave plot for legal purposes. Please provide the necessary certificates.",
    "I would like to request access to visit my family's grave during non-visiting hours for a special occasion."
];

const statuses = ["pending", "processing", "approved", "rejected"] as const;
const priorities = ["low", "medium", "high"] as const;

// Helper functions
function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateRequestData() {
    const details = getRandomElement(requestDetails);
    const priority = getRandomElement(priorities);
    const contactPhone = `+63${Math.floor(Math.random() * 9000000000) + 1000000000}`;
    const preferredContactTime = getRandomElement([
        "Morning (8AM-12PM)",
        "Afternoon (12PM-5PM)",
        "Evening (5PM-8PM)",
        "Any time"
    ]);
    const additionalNotes = Math.random() > 0.7 ?
        getRandomElement([
            "Please contact me via phone for urgent matters.",
            "I am available on weekends only.",
            "Please send updates via email.",
            "I prefer to be contacted in the morning."
        ]) : null;

    return {
        details,
        priority,
        contactPhone,
        preferredContactTime,
        additionalNotes
    };
}

function generateLogEntry(status: string, userName: string): string {
    const logTemplates = {
        pending: [
            "Request submitted and is under review.",
            "Request received and will be processed within 3-5 business days.",
            "Request is being reviewed by our team.",
            "Request submitted successfully. Thank you for your patience."
        ],
        processing: [
            "Request is now being processed by our team.",
            "Request is under active review and investigation.",
            "Request is being handled by the appropriate department.",
            "Request processing has begun. Updates will be provided soon."
        ],
        approved: [
            "Request has been approved and will be processed.",
            "Request approved. You will receive confirmation details soon.",
            "Request has been approved by the management team.",
            "Request approved successfully. Next steps will be communicated."
        ],
        rejected: [
            "Request has been reviewed but cannot be approved at this time.",
            "Request rejected due to policy restrictions.",
            "Request cannot be processed as submitted. Please contact us for more information.",
            "Request rejected. Please review the requirements and resubmit if applicable."
        ]
    };

    const templates = logTemplates[status as keyof typeof logTemplates] || logTemplates.pending;
    return getRandomElement(templates);
}

async function clearExistingData() {
    console.log("🧹 Clearing existing data...");

    // Delete in correct order due to foreign key constraints
    await db.delete(requestLogs);
    await db.delete(requestStatusTable);
    await db.delete(request);
    await db.delete(user);

    console.log("✅ Existing data cleared");
}

async function seedUsers() {
    console.log("👥 Seeding users...");

    for (const userData of sampleUsers) {
        await db.insert(user).values({
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    console.log(`✅ Seeded ${sampleUsers.length} users`);
}

async function seedGraveClusters() {
    console.log("🏛️ Seeding grave clusters...");

    const clusters = [
        {
            id: "cluster-1",
            name: "Garden of Peace",
            clusterNumber: 1,
            coordinates: { latitude: 14.5995, longitude: 120.9842 },
        },
        {
            id: "cluster-2",
            name: "Memorial Gardens",
            clusterNumber: 2,
            coordinates: { latitude: 14.6005, longitude: 120.9852 },
        },
        {
            id: "cluster-3",
            name: "Eternal Rest",
            clusterNumber: 3,
            coordinates: { latitude: 14.6015, longitude: 120.9862 },
        }
    ];

    for (const cluster of clusters) {
        await db.insert(graveCluster).values({
            ...cluster,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    console.log(`✅ Seeded ${clusters.length} grave clusters`);
}

async function seedGraveDetails() {
    console.log("🪦 Seeding grave details...");

    const graveDetailsData = [
        {
            id: "grave-1",
            graveClusterId: "cluster-1",
            graveJson: {
                plotNumber: "A-001",
                section: "A",
                row: 1,
                position: 1,
                owner: "Santos Family",
                deceased: "Jose Santos",
                birthDate: "1950-01-15",
                deathDate: "2023-03-15"
            },
            graveExpirationDate: new Date("2053-03-15"),
        },
        {
            id: "grave-2",
            graveClusterId: "cluster-1",
            graveJson: {
                plotNumber: "A-002",
                section: "A",
                row: 1,
                position: 2,
                owner: "Dela Cruz Family",
                deceased: "Maria Dela Cruz",
                birthDate: "1945-06-20",
                deathDate: "2022-11-10"
            },
            graveExpirationDate: new Date("2052-11-10"),
        },
        {
            id: "grave-3",
            graveClusterId: "cluster-2",
            graveJson: {
                plotNumber: "B-001",
                section: "B",
                row: 1,
                position: 1,
                owner: "Rodriguez Family",
                deceased: "Carlos Rodriguez",
                birthDate: "1960-09-05",
                deathDate: "2024-01-20"
            },
            graveExpirationDate: new Date("2054-01-20"),
        }
    ];

    for (const grave of graveDetailsData) {
        await db.insert(graveDetails).values({
            ...grave,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    console.log(`✅ Seeded ${graveDetailsData.length} grave details`);
}

async function seedRequests() {
    console.log("📝 Seeding requests...");

    const requests = [];
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

    // Generate 50 sample requests
    for (let i = 0; i < 50; i++) {
        const requestId = `request-${i + 1}`;
        const userId = getRandomElement(sampleUsers.filter(u => u.role === "user")).id;
        const requestType = getRandomElement(requestTypes);
        const requestData = generateRequestData();
        const createdAt = getRandomDate(threeMonthsAgo, now);
        const status = getRandomElement(statuses);

        // Some requests should be overdue (pending for more than 7 days)
        const isOverdue = status === "pending" && (now.getTime() - createdAt.getTime()) > (7 * 24 * 60 * 60 * 1000);
        const finalStatus = isOverdue ? "pending" : status;

        const requestDetails = JSON.stringify({
            details: `${requestType}: ${requestData.details}`,
            priority: requestData.priority,
            contactPhone: requestData.contactPhone,
            preferredContactTime: requestData.preferredContactTime,
            additionalNotes: requestData.additionalNotes,
        });

        requests.push({
            id: requestId,
            userId,
            requestDetails,
            requestRelatedGrave: Math.random() > 0.7 ? getRandomElement(["grave-1", "grave-2", "grave-3"]) : null,
            createdAt,
            updatedAt: createdAt,
        });
    }

    // Insert requests
    for (const requestData of requests) {
        await db.insert(request).values(requestData);
    }

    console.log(`✅ Seeded ${requests.length} requests`);
    return requests;
}

async function seedRequestStatuses(requests: any[]) {
    console.log("📊 Seeding request statuses...");

    for (const requestData of requests) {
        const statusId = `status-${requestData.id}`;
        const status = getRandomElement(statuses);
        const remark = getRandomElement([
            "Request submitted",
            "Under review",
            "Processing in progress",
            "Approved by management",
            "Rejected due to policy",
            "Additional information required",
            "Approved with conditions",
            "Pending documentation"
        ]);

        await db.insert(requestStatusTable).values({
            id: statusId,
            requestId: requestData.id,
            status,
            remark,
            createdAt: requestData.createdAt,
            updatedAt: requestData.createdAt,
        });
    }

    console.log(`✅ Seeded ${requests.length} request statuses`);
}

async function seedRequestLogs(requests: any[]) {
    console.log("📋 Seeding request logs...");

    for (const requestData of requests) {
        const logCount = Math.floor(Math.random() * 5) + 1; // 1-5 logs per request

        for (let i = 0; i < logCount; i++) {
            const logId = `log-${requestData.id}-${i + 1}`;
            const logCreatedAt = new Date(requestData.createdAt.getTime() + (i * 24 * 60 * 60 * 1000));
            const logUser = i === 0 ? requestData.userId : getRandomElement(sampleUsers).id;

            // Get the status for this request
            const statusResult = await db.select()
                .from(requestStatusTable)
                .where(eq(requestStatusTable.requestId, requestData.id))
                .limit(1);

            const status = statusResult[0]?.status || "pending";
            const logMessage = generateLogEntry(status, sampleUsers.find(u => u.id === logUser)?.name || "Unknown");

            await db.insert(requestLogs).values({
                id: logId,
                requestId: requestData.id,
                userId: logUser,
                log: logMessage,
                createdAt: logCreatedAt,
                updatedAt: logCreatedAt,
            });
        }
    }

    console.log(`✅ Seeded request logs for ${requests.length} requests`);
}

async function main() {
    try {
        console.log("🌱 Starting request seeder...");

        // Clear existing data
        await clearExistingData();

        // Seed data in correct order
        await seedUsers();
        await seedGraveClusters();
        await seedGraveDetails();
        const requests = await seedRequests();
        await seedRequestStatuses(requests);
        await seedRequestLogs(requests);

        console.log("🎉 Request seeding completed successfully!");
        console.log("\n📊 Summary:");
        console.log(`- Users: ${sampleUsers.length}`);
        console.log(`- Grave Clusters: 3`);
        console.log(`- Grave Details: 3`);
        console.log(`- Requests: ${requests.length}`);
        console.log(`- Request Statuses: ${requests.length}`);
        console.log(`- Request Logs: ~${requests.length * 3} (estimated)`);

    } catch (error) {
        console.error("❌ Error during seeding:", error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run the seeder
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

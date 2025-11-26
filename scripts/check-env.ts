#!/usr/bin/env tsx

/**
 * Environment Check Script
 * 
 * This script verifies that all required environment variables and dependencies
 * are properly configured before running the seeder.
 * 
 * Usage:
 *   npm run check:env
 *   or
 *   tsx scripts/check-env.ts
 */

import { config } from "dotenv";
import postgres from "postgres";

// Load environment variables
config();

async function checkDatabaseConnection() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error("❌ DATABASE_URL environment variable is not set");
        console.log("   Please add DATABASE_URL to your .env file");
        return false;
    }

    try {
        console.log("🔌 Testing database connection...");
        const client = postgres(connectionString);
        await client`SELECT 1`;
        await client.end();
        console.log("✅ Database connection successful");
        return true;
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        console.log("   Please check your DATABASE_URL and ensure the database is running");
        return false;
    }
}

function checkRequiredEnvVars() {
    console.log("🔍 Checking required environment variables...");

    const required = [
        'DATABASE_URL',
    ];

    const optional = [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL',
    ];

    let allPresent = true;

    for (const envVar of required) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar} is set`);
        } else {
            console.log(`❌ ${envVar} is missing`);
            allPresent = false;
        }
    }

    for (const envVar of optional) {
        if (process.env[envVar]) {
            console.log(`✅ ${envVar} is set (optional)`);
        } else {
            console.log(`⚠️  ${envVar} is not set (optional)`);
        }
    }

    return allPresent;
}

function checkDependencies() {
    console.log("📦 Checking dependencies...");

    try {
        // Check if postgres is available
        require('postgres');
        console.log("✅ postgres package is available");
    } catch (error) {
        console.log("❌ postgres package is not installed");
        console.log("   Run: npm install postgres");
        return false;
    }

    try {
        // Check if drizzle-orm is available
        require('drizzle-orm');
        console.log("✅ drizzle-orm package is available");
    } catch (error) {
        console.log("❌ drizzle-orm package is not installed");
        console.log("   Run: npm install drizzle-orm");
        return false;
    }

    return true;
}

async function main() {
    console.log("🔧 Environment Check for Request Seeder\n");

    const envCheck = checkRequiredEnvVars();
    const depsCheck = checkDependencies();
    const dbCheck = await checkDatabaseConnection();

    console.log("\n📋 Summary:");

    if (envCheck && depsCheck && dbCheck) {
        console.log("🎉 All checks passed! You can run the seeder with:");
        console.log("   npm run seed:requests");
    } else {
        console.log("❌ Some checks failed. Please fix the issues above before running the seeder.");
        process.exit(1);
    }
}

// Run the check
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

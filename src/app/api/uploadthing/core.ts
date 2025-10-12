import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/server/auth";

const f = createUploadthing();

// Helper function to get session from request
async function getSession(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        return session;
    } catch (error) {
        console.error("Error getting session:", error);
        return null;
    }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Grave image uploader - accepts up to 3 images per grave
    graveImageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 3,
        },
    })
        .middleware(async ({ req }) => {
            // Temporarily disable auth to test upload functionality
            // TODO: Re-enable authentication once basic upload works
            console.log("Grave image upload middleware - auth temporarily disabled");

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return {
                userId: "temp-user",
                userRole: "admin",
                uploadType: "grave" as const
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Grave image upload complete for userId:", metadata.userId);
            console.log("file url", file.url);

            // Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return {
                uploadedBy: metadata.userId,
                uploadType: metadata.uploadType,
                fileUrl: file.url,
                fileName: file.name,
                fileSize: file.size
            };
        }),

    // Instruction step image uploader - accepts 1 image per step
    instructionImageUploader: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async ({ req }) => {
            // Temporarily disable auth to test upload functionality
            // TODO: Re-enable authentication once basic upload works
            console.log("Instruction image upload middleware - auth temporarily disabled");

            // Whatever is returned here is accessible in onUploadComplete as `metadata`
            return {
                userId: "temp-user",
                userRole: "admin",
                uploadType: "instruction" as const
            };
        })
        .onUploadComplete(async ({ metadata, file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Instruction image upload complete for userId:", metadata.userId);
            console.log("file url", file.url);

            // Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
            return {
                uploadedBy: metadata.userId,
                uploadType: metadata.uploadType,
                fileUrl: file.url,
                fileName: file.name,
                fileSize: file.size
            };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

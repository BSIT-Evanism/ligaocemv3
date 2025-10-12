import { UTApi } from "uploadthing/server";
import { env } from "@/env.js";

export const utapi = new UTApi({
    apiKey: env.UPLOADTHING_TOKEN,
});

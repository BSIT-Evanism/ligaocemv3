/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { env } from "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    typedRoutes: true,
    experimental: {
        viewTransition: true,
        authInterrupts: true
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default config;

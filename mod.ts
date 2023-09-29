import "https://deno.land/std@0.203.0/dotenv/load.ts";
import { initTracking } from "./src/client.js";
import { logData } from "./src/logger_manager.ts";

// Configuration 
const loggerMode = Deno.env.get("LOGGER_MODE");
const mode = Deno.env.get("MODE") || "production";
const port = Number(Deno.env.get("PORT")) || 8000;
const baseURL = Deno.env.get("BACKEND_URL") || "https://localhost:"+port;
const allowedProjects = JSON.parse(Deno.env.get("ALLOWED_PROJECTS") || "[]");
const serveOptions = mode === "production"
    ? {
        // production
        port: port,
    }
    : {
        // development
        port: port,
        cert: Deno.readTextFileSync("./keys/cert.pem"),
        key: Deno.readTextFileSync("./keys/key.pem"),
    };

Deno.serve(serveOptions, async (req) => {
    const commonHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type",
    };
    const method = req.method;
    const url = new URL(req.url);
    const qs = url.searchParams;

    // Origin check goes here ...

    if (url.pathname === "/client.js" && method === "GET") {
        const trackId = qs.get("trackId") || "";

        if (trackId && allowedProjects.includes(trackId)) {
            const [realmId, projectId] = trackId.split(".");

            const body = `
                ${initTracking.toString()}
                initTracking("${realmId}", "${projectId}", "${baseURL}");
            `;
            return new Response(body, {
                status: 200,
                headers: {
                    "content-type": "application/javascript",
                    ...commonHeaders,
                },
            });
        } else {
            return new Response(null, {
                status: 403,
                headers: commonHeaders,
            });
        }
    } else if (url.pathname === "/track" && method === "POST") {
        const body = await req.text();
        const data = JSON.parse(body);

        if (
            data?.payload?.realmId && data?.payload?.projectId &&
            allowedProjects.includes(`${data.payload.realmId}.${data.payload.projectId}`)
        ) {
            logData(data, loggerMode);

            return new Response(body, {
                status: 200,
                headers: commonHeaders,
            });
        } else {
            return new Response(null, {
                status: 403,
                headers: commonHeaders,
            });
        }
    } else if (url.pathname === "/ping" && method === "GET") {
        return new Response("Pong!", {
            status: 200,
            headers: commonHeaders,
        });
    }

    return new Response(null, { status: 404 });
});

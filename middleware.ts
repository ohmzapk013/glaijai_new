import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Define protected routes
    if (path.startsWith("/admin")) {
        const session = request.cookies.get("admin_session")?.value;

        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const parsed = await decrypt(session);
        if (!parsed) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        // Add user info to headers if needed for server components
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("x-user-permissions", JSON.stringify(parsed.permissions));

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET(request: Request) {
    try {
        const session = (await cookies()).get("admin_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settingsDoc = await db.collection("system_settings").doc("security").get();
        const settings = settingsDoc.data() || {
            loginLockout: {
                enabled: true,
                maxAttempts: 5,
                lockDurationMinutes: 10,
            },
            turnstile: {
                enabled: false,
                siteKey: "",
                secretKey: "",
            },
        };

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = (await cookies()).get("admin_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Validation could be added here

        await db.collection("system_settings").doc("security").set(body, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

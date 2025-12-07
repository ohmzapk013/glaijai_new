import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const settingsDoc = await db.collection("system_settings").doc("security").get();
        const settings = settingsDoc.data() || {};

        // Only expose public info
        const publicSettings = {
            turnstile: {
                enabled: settings.turnstile?.enabled || false,
                siteKey: settings.turnstile?.siteKey || "",
            }
        };

        return NextResponse.json(publicSettings);
    } catch (error) {
        console.error("Error fetching public settings:", error);
        // Default safe values
        return NextResponse.json({
            turnstile: { enabled: false, siteKey: "" }
        });
    }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
    const session = await getSession();

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch fresh user data from database to get latest permissions
    try {
        const userDoc = await db.collection("users").doc(session.username).get();

        if (!userDoc.exists) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userData = userDoc.data();

        return NextResponse.json({
            user: {
                username: userData?.username,
                permissions: userData?.permissions || []
            }
        });
    } catch (error) {
        console.error("Error fetching user data:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

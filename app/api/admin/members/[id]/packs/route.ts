import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Check Admin Auth
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("admin_session");

        if (!sessionCookie) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const session = await decrypt(sessionCookie.value);
        if (!session) {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 401 }
            );
        }

        // 2. Get Member ID (Email) from params
        const { id } = await params;
        const memberEmail = decodeURIComponent(id); // Email might be URL encoded

        // 3. Fetch Packs created by this member
        // We check both 'createdBy' (memberId/email) and 'creatorName' just in case, 
        // but primarily 'createdBy' should match the email or memberId.
        // Since we know we saved memberId as email in recent fixes, we query by that.

        const packsSnapshot = await db
            .collection("custom_packs")
            .where("createdBy", "==", memberEmail)
            // .orderBy("createdAt", "desc") // Requires index
            .get();

        const packs = packsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ packs });
    } catch (error) {
        console.error("Error fetching member packs:", error);
        return NextResponse.json(
            { error: "Failed to fetch packs" },
            { status: 500 }
        );
    }
}

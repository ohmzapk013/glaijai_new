import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/lib/firebaseAdmin";

export async function GET() {
    const session = (await cookies()).get("member_session")?.value;

    if (!session) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const parsed = await decrypt(session);

    if (!parsed || parsed.type !== "member") {
        return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Fetch fresh data from Firestore
    const memberId = parsed.memberId || parsed.id;
    const memberDoc = await db.collection("members").doc(memberId).get();

    if (!memberDoc.exists) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const memberData = memberDoc.data();

    return NextResponse.json({
        member: {
            email: memberData?.email || parsed.email,
            displayName: memberData?.displayName || parsed.displayName,
        },
    });
}

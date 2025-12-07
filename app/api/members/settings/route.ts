import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
    try {
        const session = (await cookies()).get("member_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "member") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const memberId = parsed.memberId || parsed.id;
        const memberDoc = await db.collection("members").doc(memberId).get();
        if (!memberDoc.exists) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        const data = memberDoc.data();
        return NextResponse.json({
            displayName: data?.displayName || "",
            email: data?.email || ""
        });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = (await cookies()).get("member_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "member") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { displayName, currentPassword, newPassword } = body;

        const memberId = parsed.memberId || parsed.id;

        // Get current member data
        const memberDoc = await db.collection("members").doc(memberId).get();
        if (!memberDoc.exists) {
            return NextResponse.json({ error: "Member not found" }, { status: 404 });
        }

        const updateData: any = {};
        const memberData = memberDoc.data();

        // Handle display name update
        if (displayName !== undefined) {
            const trimmedName = displayName.trim();
            if (!trimmedName) {
                return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
            }
            if (trimmedName.length > 50) {
                return NextResponse.json({ error: "Display name too long (max 50 characters)" }, { status: 400 });
            }
            updateData.displayName = trimmedName;
        }

        // Handle password update
        if (currentPassword && newPassword) {
            if (newPassword.length < 6) {
                return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, memberData?.password);
            if (!isValid) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateData.password = hashedPassword;
        }

        // Update member document
        if (Object.keys(updateData).length > 0) {
            await db.collection("members").doc(memberId).update(updateData);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

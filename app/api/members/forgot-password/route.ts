import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const memberDoc = await db.collection("members").doc(email).get();

        if (!memberDoc.exists) {
            // Should not reveal that user doesn't exist, but for this demo/MVP we might want to be explicit or generic
            // For security, usually return success even if email not found
            // But for UX in small apps, saying "Email not found" helps
            // Let's go with Generic for security but Log it.
            console.log(`Forgot Password: Email ${email} not found.`);
            // Return success to prevent enumeration, or error if we want easier debugging for user
            // Given the context of "making it work", let's return error but in a real app use generic.
            // Actually, let's return a specific error for now as it's easier to test.
            return NextResponse.json({ error: "Email not found in system" }, { status: 404 });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetPasswordExpires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        await db.collection("members").doc(email).update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetPasswordExpires,
        });

        // Mock Email Sending
        console.log("============================================");
        console.log(`[Mock Email Service] Password Reset Requested`);
        console.log(`To: ${email}`);
        console.log(`Link: http://localhost:3000/reset-password?token=${resetToken}`);
        console.log("============================================");

        return NextResponse.json({
            success: true,
            message: "Password reset instructions sent"
        });

    } catch (error) {
        console.error("Error in forgot-password:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

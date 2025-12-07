import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const memberDoc = await db.collection("members").doc(email).get();

        if (!memberDoc.exists) {
            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        const memberData = memberDoc.data();
        const settingsDoc = await db.collection("system_settings").doc("security").get();
        const settings = settingsDoc.data()?.loginLockout || {
            enabled: true,
            maxAttempts: 5,
            lockDurationMinutes: 10
        };

        // Check Lockout Status
        if (settings.enabled && memberData?.lockoutUntil) {
            const lockoutTime = new Date(memberData.lockoutUntil).getTime();
            const now = new Date().getTime();

            if (now < lockoutTime) {
                const remainingMinutes = Math.ceil((lockoutTime - now) / (1000 * 60));
                return NextResponse.json(
                    { error: `Account locked. Try again in ${remainingMinutes} minutes.` },
                    { status: 429 }
                );
            } else {
                // Lockout expired, reset
                await db.collection("members").doc(email).update({
                    lockoutUntil: null,
                    failedLoginAttempts: 0
                });
            }
        }

        // Check password
        const isValid = await bcrypt.compare(password, memberData?.password);

        if (!isValid) {
            // Check if member is active
            if (!memberData?.isActive) {
                return NextResponse.json(
                    { error: "Account is deactivated" },
                    { status: 403 }
                );
            }

            // Handle Failed Attempt
            if (settings.enabled) {
                const currentAttempts = (memberData?.failedLoginAttempts || 0) + 1;

                if (currentAttempts >= settings.maxAttempts) {
                    const lockUntil = new Date();
                    lockUntil.setMinutes(lockUntil.getMinutes() + settings.lockDurationMinutes);

                    await db.collection("members").doc(email).update({
                        failedLoginAttempts: currentAttempts,
                        lockoutUntil: lockUntil.toISOString()
                    });

                    return NextResponse.json(
                        { error: `Too many failed attempts. Account locked for ${settings.lockDurationMinutes} minutes.` },
                        { status: 429 }
                    );
                } else {
                    await db.collection("members").doc(email).update({
                        failedLoginAttempts: currentAttempts
                    });
                }
            }

            return NextResponse.json(
                { error: "Invalid credentials" },
                { status: 401 }
            );
        }

        // Check if member is active (successful password but inactive)
        if (!memberData?.isActive) {
            return NextResponse.json(
                { error: "Account is deactivated" },
                { status: 403 }
            );
        }

        // Login Success - Reset Lockout counters & Update Last Login
        await db.collection("members").doc(email).update({
            lastLogin: new Date().toISOString(),
            failedLoginAttempts: 0,
            lockoutUntil: null
        });

        // Create session
        const session = await encrypt({
            memberId: memberData?.email, // Use email as memberId
            email: memberData?.email,
            displayName: memberData?.displayName,
            type: "member",
        });

        // Set cookie
        (await cookies()).set("member_session", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return NextResponse.json({
            success: true,
            member: {
                email: memberData?.email,
                displayName: memberData?.displayName,
            },
        });
    } catch (error) {
        console.error("Member login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

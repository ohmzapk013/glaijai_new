import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
    try {
        const { email, password, displayName, cfTurnstileResponse } = await request.json();

        if (!email || !password || !displayName) {
            return NextResponse.json(
                { error: "Email, password, and display name are required" },
                { status: 400 }
            );
        }

        // --- Cloudflare Turnstile Verification ---
        const settingsDoc = await db.collection("system_settings").doc("security").get();
        const settings = settingsDoc.data()?.turnstile || {
            enabled: false,
            siteKey: "",
            secretKey: ""
        };

        if (settings.enabled) {
            if (!cfTurnstileResponse) {
                return NextResponse.json(
                    { error: "Captcha verification failed (missing token)" },
                    { status: 400 }
                );
            }

            const formData = new FormData();
            formData.append("secret", settings.secretKey);
            formData.append("response", cfTurnstileResponse);
            // formData.append("remoteip", request.headers.get("x-forwarded-for") || "");

            const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
                method: "POST",
                body: formData,
            });

            const turnstileData = await turnstileRes.json();

            if (!turnstileData.success) {
                console.error("Turnstile verification failed:", turnstileData);
                return NextResponse.json(
                    { error: "Captcha verification failed" },
                    { status: 400 }
                );
            }
        }
        // ----------------------------------------

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingMember = await db.collection("members").doc(email).get();
        if (existingMember.exists) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create member
        await db.collection("members").doc(email).set({
            email,
            password: hashedPassword,
            displayName,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            failedLoginAttempts: 0,
            lockoutUntil: null
        });

        // Trigger notification
        await createNotification("new_user", `New member registered: ${displayName} (${email})`, email);

        return NextResponse.json({
            success: true,
            message: "Registration successful",
        });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Failed to register" },
            { status: 500 }
        );
    }
}

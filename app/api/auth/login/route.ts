import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: Request) {
    try {
        const { username, password } = await request.json();
        console.log("Login attempt for username:", username);

        if (!username || !password) {
            return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
        }

        const userDoc = await db.collection("users").doc(username).get();
        console.log("User exists:", userDoc.exists);

        if (!userDoc.exists) {
            console.log("User not found in database");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const userData = userDoc.data();
        console.log("User data retrieved:", { username: userData?.username, hasPassword: !!userData?.password });

        const isValid = await bcrypt.compare(password, userData?.password);
        console.log("Password valid:", isValid);

        if (!isValid) {
            console.log("Password comparison failed");
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Create session
        const session = await encrypt({
            username: userData?.username,
            permissions: userData?.permissions,
            type: "admin"
        });

        // Set cookie
        (await cookies()).set("admin_session", session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 // 1 day
        });

        console.log("Login successful for:", username);
        return NextResponse.json({ success: true, user: { username: userData?.username, permissions: userData?.permissions } });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

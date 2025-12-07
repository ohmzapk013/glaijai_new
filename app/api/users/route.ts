import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        const snapshot = await db.collection("users").get();
        const users = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                username: doc.id,
                permissions: data.permissions || [],
                createdAt: data.createdAt
            };
        });
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { username, password, permissions } = await request.json();

        if (!username || !password) {
            return NextResponse.json({ error: "Username and password required" }, { status: 400 });
        }

        const userRef = db.collection("users").doc(username);
        const doc = await userRef.get();

        if (doc.exists) {
            return NextResponse.json({ error: "User already exists" }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await userRef.set({
            username,
            password: hashedPassword,
            permissions: permissions || [],
            createdAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true, user: { username, permissions } });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { username, password, permissions } = await request.json();

        if (!username) {
            return NextResponse.json({ error: "Username required" }, { status: 400 });
        }

        const updateData: any = { permissions };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await db.collection("users").doc(username).update(updateData);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json({ error: "Username required" }, { status: 400 });
        }

        await db.collection("users").doc(username).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}

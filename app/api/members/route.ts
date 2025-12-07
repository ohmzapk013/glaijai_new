import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const offset = (page - 1) * limit;

        const snapshot = await db
            .collection("members")
            .orderBy("createdAt", "desc")
            .limit(limit)
            .offset(offset)
            .get();

        const countSnapshot = await db.collection("members").count().get();
        const total = countSnapshot.data().count;

        const members = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                email: doc.id,
                displayName: data.displayName,
                createdAt: data.createdAt,
                lastLogin: data.lastLogin,
                isActive: data.isActive,
                lockoutUntil: data.lockoutUntil || null,
            };
        });

        return NextResponse.json({
            data: members,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { email, password, displayName } = await request.json();

        if (!email || !password || !displayName) {
            return NextResponse.json(
                { error: "Email, password, and display name are required" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingMember = await db.collection("members").doc(email).get();
        if (existingMember.exists) {
            return NextResponse.json(
                { error: "Email already exists" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection("members").doc(email).set({
            email,
            password: hashedPassword,
            displayName,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating member:", error);
        return NextResponse.json(
            { error: "Failed to create member" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const { email, newEmail, displayName, password, isActive } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const updateData: any = {};

        if (displayName !== undefined) updateData.displayName = displayName;
        if (isActive !== undefined) updateData.isActive = isActive;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // If email is changing, we need to migrate the document
        if (newEmail && newEmail !== email) {
            const newEmailDoc = await db.collection("members").doc(newEmail).get();
            if (newEmailDoc.exists) {
                return NextResponse.json(
                    { error: "New email already exists" },
                    { status: 409 }
                );
            }

            const oldDoc = await db.collection("members").doc(email).get();
            if (!oldDoc.exists) {
                return NextResponse.json(
                    { error: "Member not found" },
                    { status: 404 }
                );
            }

            const oldData = oldDoc.data();
            await db.collection("members").doc(newEmail).set({
                ...oldData,
                ...updateData,
                email: newEmail,
            });
            await db.collection("members").doc(email).delete();
        } else {
            await db.collection("members").doc(email).update(updateData);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating member:", error);
        return NextResponse.json(
            { error: "Failed to update member" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        await db.collection("members").doc(email).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting member:", error);
        return NextResponse.json(
            { error: "Failed to delete member" },
            { status: 500 }
        );
    }
}

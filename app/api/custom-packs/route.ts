import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { decrypt } from "@/lib/auth";
import { cookies } from "next/headers";
import { createNotification } from "@/lib/notifications";

// Generate unique 8-character share code
function generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET - List user's packs or get by share code
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const shareCode = searchParams.get("shareCode");
        const memberId = searchParams.get("memberId");

        // Get pack by share code (public access)
        if (shareCode) {
            const packsSnapshot = await db
                .collection("custom_packs")
                .where("shareCode", "==", shareCode.toUpperCase())
                .limit(1)
                .get();

            if (packsSnapshot.empty) {
                return NextResponse.json(
                    { error: "Pack not found" },
                    { status: 404 }
                );
            }

            const packData = packsSnapshot.docs[0].data();
            const pack = {
                id: packsSnapshot.docs[0].id,
                ...packData,
            };

            // Increment play count
            await db.collection("custom_packs").doc(pack.id).update({
                playCount: ((packData.playCount as number) || 0) + 1,
            });

            return NextResponse.json(pack);
        }

        // Get user's packs (requires auth)
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("member_session");

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

        // Use memberId if available, otherwise fallback to email (for older sessions)
        const userId = session.memberId || session.email;

        if (!userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("Fetching packs for userId:", userId);

        const packsSnapshot = await db
            .collection("custom_packs")
            .where("createdBy", "==", userId)
            // .orderBy("createdAt", "desc") // Requires index
            .get();

        console.log("Found packs:", packsSnapshot.size);

        const packs = packsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ packs });
    } catch (error) {
        console.error("Error fetching packs:", error);
        return NextResponse.json(
            { error: "Failed to fetch packs" },
            { status: 500 }
        );
    }
}

// POST - Create new pack
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("member_session");

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

        const data = await request.json();

        // Validate required fields
        if (!data.title || !data.title.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
            return NextResponse.json(
                { error: "At least one question is required" },
                { status: 400 }
            );
        }

        // Validate questions
        for (const q of data.questions) {
            if ((!q.content_th || !q.content_th.trim()) && (!q.content_en || !q.content_en.trim())) {
                return NextResponse.json(
                    { error: "Each question must have content in at least one language" },
                    { status: 400 }
                );
            }
        }

        // Generate unique share code
        let shareCode = generateShareCode();
        let codeExists = true;

        while (codeExists) {
            const existing = await db
                .collection("custom_packs")
                .where("shareCode", "==", shareCode)
                .limit(1)
                .get();

            if (existing.empty) {
                codeExists = false;
            } else {
                shareCode = generateShareCode();
            }
        }

        const newPack = {
            createdBy: session.memberId || session.email || "",
            creatorName: session.displayName || session.email || "Anonymous",
            title: data.title.trim(),
            description: data.description?.trim() || "",
            isPublic: data.isPublic !== false,
            shareCode: shareCode,
            questions: data.questions.map((q: any) => ({
                content_th: q.content_th?.trim() || "",
                content_en: q.content_en?.trim() || "",
            })),
            createdAt: new Date().toISOString(),
            playCount: 0,
        };

        // Remove any undefined values
        const cleanPack = Object.fromEntries(
            Object.entries(newPack).filter(([_, v]) => v !== undefined)
        );

        const docRef = await db.collection("custom_packs").add(cleanPack);

        // Trigger notification
        await createNotification(
            "new_pack",
            `New pack created: ${cleanPack.title} by ${cleanPack.creatorName}`,
            docRef.id
        );

        return NextResponse.json({
            id: docRef.id,
            ...cleanPack,
        });
    } catch (error) {
        console.error("Error creating pack:", error);
        return NextResponse.json(
            { error: "Failed to create pack" },
            { status: 500 }
        );
    }
}

// PUT - Update pack
export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("member_session");

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

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json(
                { error: "Pack ID is required" },
                { status: 400 }
            );
        }

        // Check ownership
        const packDoc = await db.collection("custom_packs").doc(id).get();
        if (!packDoc.exists) {
            return NextResponse.json(
                { error: "Pack not found" },
                { status: 404 }
            );
        }

        const packData = packDoc.data();
        const userId = session.memberId || session.email;
        if (packData?.createdBy !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        await db.collection("custom_packs").doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating pack:", error);
        return NextResponse.json(
            { error: "Failed to update pack" },
            { status: 500 }
        );
    }
}

// DELETE - Delete pack
export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("member_session");

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

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Pack ID is required" },
                { status: 400 }
            );
        }

        // Check ownership
        const packDoc = await db.collection("custom_packs").doc(id).get();
        if (!packDoc.exists) {
            return NextResponse.json(
                { error: "Pack not found" },
                { status: 404 }
            );
        }

        const packData = packDoc.data();
        const userId = session.memberId || session.email;
        if (packData?.createdBy !== userId) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 403 }
            );
        }

        await db.collection("custom_packs").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting pack:", error);
        return NextResponse.json(
            { error: "Failed to delete pack" },
            { status: 500 }
        );
    }
}

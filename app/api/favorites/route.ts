import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/lib/firebaseAdmin";

// GET - Fetch all favorite categories for logged-in member
export async function GET() {
    try {
        const session = (await cookies()).get("member_session")?.value;

        if (!session) {
            return NextResponse.json({ error: "Not logged in" }, { status: 401 });
        }

        const parsed = await decrypt(session);

        if (!parsed || parsed.type !== "member") {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const memberId = parsed.email;

        // Fetch all favorite categories for this member
        const favoritesSnapshot = await db
            .collection("favorites")
            .doc(memberId)
            .collection("categories")
            .orderBy("savedAt", "desc")
            .get();

        const favorites = favoritesSnapshot.docs.map((doc) => ({
            categoryId: doc.id,
            ...doc.data(),
        }));

        return NextResponse.json({ favorites });
    } catch (error) {
        console.error("Error fetching favorites:", error);
        return NextResponse.json(
            { error: "Failed to fetch favorites" },
            { status: 500 }
        );
    }
}

// POST - Add category to favorites
export async function POST(request: Request) {
    try {
        const session = (await cookies()).get("member_session")?.value;

        if (!session) {
            return NextResponse.json({ error: "Not logged in" }, { status: 401 });
        }

        const parsed = await decrypt(session);

        if (!parsed || parsed.type !== "member") {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const memberId = parsed.email;
        const { categoryId, title_th, title_en, description_th, description_en } = await request.json();

        // Get category data to copy iconClass and iconColor
        const categoryDoc = await db.collection("categories").doc(categoryId).get();
        const categoryData = categoryDoc.data();

        if (!categoryId) {
            return NextResponse.json(
                { error: "categoryId is required" },
                { status: 400 }
            );
        }

        // Add to favorites
        await db
            .collection("favorites")
            .doc(memberId)
            .collection("categories")
            .doc(categoryId)
            .set({
                categoryId,
                title_th: title_th || "",
                title_en: title_en || "",
                description_th: description_th || "",
                description_en: description_en || "",
                iconClass: categoryData?.iconClass || "",
                iconColor: categoryData?.iconColor || "pink-500",
                savedAt: new Date().toISOString(),
            });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error adding favorite:", error);
        return NextResponse.json(
            { error: "Failed to add favorite" },
            { status: 500 }
        );
    }
}

// DELETE - Remove category from favorites
export async function DELETE(request: Request) {
    try {
        const session = (await cookies()).get("member_session")?.value;

        if (!session) {
            return NextResponse.json({ error: "Not logged in" }, { status: 401 });
        }

        const parsed = await decrypt(session);

        if (!parsed || parsed.type !== "member") {
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const memberId = parsed.email;
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        if (!categoryId) {
            return NextResponse.json(
                { error: "categoryId is required" },
                { status: 400 }
            );
        }

        // Remove from favorites
        await db
            .collection("favorites")
            .doc(memberId)
            .collection("categories")
            .doc(categoryId)
            .delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing favorite:", error);
        return NextResponse.json(
            { error: "Failed to remove favorite" },
            { status: 500 }
        );
    }
}

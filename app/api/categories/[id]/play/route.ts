import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        // Increment visit count (totalViews)
        const categoryRef = db.collection("categories").doc(id);
        await categoryRef.update({
            visitCount: FieldValue.increment(1)
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error incrementing play count:", error);
        return NextResponse.json(
            { error: "Failed to update play count" },
            { status: 500 }
        );
    }
}

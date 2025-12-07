import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ shareCode: string }> }
) {
    try {
        const { shareCode } = await params;

        if (!shareCode) {
            return NextResponse.json(
                { error: "Share code is required" },
                { status: 400 }
            );
        }

        // Search for pack with this shareCode
        const packsSnapshot = await db.collection("custom_packs")
            .where("shareCode", "==", shareCode)
            .limit(1)
            .get();

        if (packsSnapshot.empty) {
            return NextResponse.json(
                { error: "Pack not found" },
                { status: 404 }
            );
        }

        const packDoc = packsSnapshot.docs[0];
        const packData = packDoc.data();

        // Questions are stored in the 'questions' field of the pack document
        const questions = packData.questions || [];

        // Increment play count
        await db.collection("custom_packs").doc(packDoc.id).update({
            playCount: FieldValue.increment(1)
        });

        return NextResponse.json({
            id: packDoc.id,
            ...packData,
            questions
        });

    } catch (error) {
        console.error("Error fetching custom pack:", error);
        return NextResponse.json(
            { error: "Failed to fetch pack" },
            { status: 500 }
        );
    }
}

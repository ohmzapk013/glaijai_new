import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { questions, categoryId } = await request.json();

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: "No questions provided" }, { status: 400 });
        }

        if (!categoryId) {
            return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
        }

        const batch = db.batch();
        const questionsRef = db.collection("questions");

        const now = Date.now();
        questions.forEach((q: any, index: number) => {
            const docRef = questionsRef.doc();
            // Increment time by 1ms per question to ensure order is preserved
            const createdAt = new Date(now + index).toISOString();

            batch.set(docRef, {
                content_th: q.content_th,
                content_en: q.content_en,
                categoryId: categoryId,
                createdAt: createdAt,
            });
        });

        await batch.commit();

        return NextResponse.json({ success: true, count: questions.length });
    } catch (error) {
        console.error("Error batch creating questions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getSession();
        if (!session || session.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: "No IDs provided" }, { status: 400 });
        }

        const batch = db.batch();
        const questionsRef = db.collection("questions");

        ids.forEach((id: string) => {
            const docRef = questionsRef.doc(id);
            batch.delete(docRef);
        });

        await batch.commit();

        return NextResponse.json({ success: true, count: ids.length });
    } catch (error) {
        console.error("Error batch deleting questions:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

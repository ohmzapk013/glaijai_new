import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

// Track question view or skip
export async function POST(request: Request) {
    try {
        const sessionCookie = (await cookies()).get("member_session")?.value;
        let memberId = null;
        if (sessionCookie) {
            const parsed = await decrypt(sessionCookie);
            if (parsed && parsed.type === "member") {
                memberId = parsed.id;
            }
        }

        const body = await request.json();
        console.log("Track API Request Body:", body);
        const { questionId, action, sessionId } = body;

        if (!questionId || !action) {
            return NextResponse.json(
                { error: "questionId and action are required" },
                { status: 400 }
            );
        }

        if (!["view", "skip"].includes(action)) {
            return NextResponse.json(
                { error: "action must be 'view' or 'skip'" },
                { status: 400 }
            );
        }

        const questionRef = db.collection("questions").doc(questionId);
        const questionDoc = await questionRef.get();

        if (!questionDoc.exists) {
            return NextResponse.json(
                { error: "Question not found" },
                { status: 404 }
            );
        }

        // Update question analytics
        // Update question analytics using atomic increments
        const batch = db.batch();
        const categoryId = questionDoc.data()?.categoryId;
        const currentData = questionDoc.data();
        const newViewCount = (currentData?.viewCount || 0) + (action === "view" ? 1 : 0);
        const newSkipCount = (currentData?.skipCount || 0) + (action === "skip" ? 1 : 0);
        const newImpressions = newViewCount + newSkipCount;
        const newSkipRate = newImpressions > 0 ? (newSkipCount / newImpressions) * 100 : 0;

        batch.update(questionRef, {
            viewCount: FieldValue.increment(action === "view" ? 1 : 0),
            skipCount: FieldValue.increment(action === "skip" ? 1 : 0),
            lastViewed: new Date().toISOString(),
            popularityScore: FieldValue.increment(action === "view" ? 1 : -2),
            skipRate: newSkipRate,
            impressions: newImpressions
        });

        // Update category stats
        if (categoryId) {
            const categoryRef = db.collection("categories").doc(categoryId);
            batch.update(categoryRef, {
                totalQuestionViews: FieldValue.increment(action === "view" ? 1 : 0),
                totalQuestionSkips: FieldValue.increment(action === "skip" ? 1 : 0)
            });
        }

        await batch.commit();

        // Optionally track individual interaction
        if (sessionId) {
            await db.collection("question_interactions").add({
                questionId,
                action,
                sessionId,
                userId: memberId, // Track user ID if available
                timestamp: new Date().toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
        });
    } catch (error) {
        console.error("Error tracking question:", error);
        return NextResponse.json(
            { error: "Failed to track question" },
            { status: 500 }
        );
    }
}

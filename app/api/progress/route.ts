import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { db } from "@/lib/firebaseAdmin";

// GET - Fetch progress for all categories
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

        // Fetch all progress for this member
        const progressSnapshot = await db
            .collection("progress")
            .doc(memberId)
            .collection("categories")
            .get();

        // Fetch all categories to get total questions
        const categoriesSnapshot = await db.collection("categories").get();
        const questionsSnapshot = await db.collection("questions").get();

        // Group questions by category
        const questionsByCategory: Record<string, number> = {};
        questionsSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            const categoryId = data.categoryId;
            if (categoryId) {
                questionsByCategory[categoryId] = (questionsByCategory[categoryId] || 0) + 1;
            }
        });

        const progress = progressSnapshot.docs.map((doc) => {
            const data = doc.data();
            const categoryId = doc.id;

            // Ensure unique completed questions
            const uniqueCompleted = new Set(data.completedQuestions || []);
            const completed = uniqueCompleted.size;

            const total = questionsByCategory[categoryId] || 0;

            // Calculate percentage and cap at 100%
            let percentage = 0;
            if (total > 0) {
                percentage = Math.round((completed / total) * 100);
                if (percentage > 100) percentage = 100;
            }

            return {
                categoryId,
                completed: Math.min(completed, total), // Cap completed count at total
                total,
                percentage,
                lastPlayed: data.lastPlayed,
            };
        });

        // Calculate overall progress
        let totalCompleted = 0;
        let totalQuestions = 0;
        progress.forEach((p) => {
            totalCompleted += p.completed;
            totalQuestions += p.total;
        });

        const overallPercentage = totalQuestions > 0 ? Math.round((totalCompleted / totalQuestions) * 100) : 0;

        return NextResponse.json({
            progress,
            overall: {
                completed: totalCompleted,
                total: totalQuestions,
                percentage: overallPercentage,
            },
        });
    } catch (error) {
        console.error("Error fetching progress:", error);
        return NextResponse.json(
            { error: "Failed to fetch progress" },
            { status: 500 }
        );
    }
}

// POST - Mark question as completed
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
        const { categoryId, questionId } = await request.json();

        if (!categoryId || !questionId) {
            return NextResponse.json(
                { error: "categoryId and questionId are required" },
                { status: 400 }
            );
        }

        const progressRef = db
            .collection("progress")
            .doc(memberId)
            .collection("categories")
            .doc(categoryId);

        const progressDoc = await progressRef.get();

        if (progressDoc.exists) {
            const data = progressDoc.data();
            const completedQuestions = data?.completedQuestions || [];

            // Add question if not already completed
            if (!completedQuestions.includes(questionId)) {
                completedQuestions.push(questionId);
                await progressRef.update({
                    completedQuestions,
                    lastPlayed: new Date().toISOString(),
                });
            }
        } else {
            // Create new progress document
            await progressRef.set({
                categoryId,
                completedQuestions: [questionId],
                lastPlayed: new Date().toISOString(),
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating progress:", error);
        return NextResponse.json(
            { error: "Failed to update progress" },
            { status: 500 }
        );
    }
}

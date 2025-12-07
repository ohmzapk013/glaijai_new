import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";
import { FieldValue } from "firebase-admin/firestore";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ categoryId: string; reviewId: string }> }
) {
    try {
        const session = (await cookies()).get("admin_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { categoryId, reviewId } = await params;

        const categoryRef = db.collection("categories").doc(categoryId);
        const reviewRef = categoryRef.collection("reviews").doc(reviewId);

        // Get review to verify existence
        const reviewDoc = await reviewRef.get();
        if (!reviewDoc.exists) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        const reviewData = reviewDoc.data();
        const rating = reviewData?.rating || 0;

        // Transaction to delete review and update stats
        await db.runTransaction(async (transaction) => {
            const categoryDoc = await transaction.get(categoryRef);
            if (!categoryDoc.exists) throw new Error("Category not found");

            const catData = categoryDoc.data();
            const currentTotal = catData?.totalReviews || 0;
            const currentAvg = catData?.averageRating || 0;

            // Calculate new stats
            let newTotal = currentTotal - 1;
            let newAvg = 0;

            if (newTotal > 0) {
                // Reverse average formula: (oldAvg * oldTotal - deletedRating) / newTotal
                newAvg = ((currentAvg * currentTotal) - rating) / newTotal;
            }

            transaction.delete(reviewRef);
            transaction.update(categoryRef, {
                totalReviews: Math.max(0, newTotal),
                averageRating: Math.max(0, newAvg)
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting review:", error);
        return NextResponse.json(
            { error: "Failed to delete review" },
            { status: 500 }
        );
    }
}

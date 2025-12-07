import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET() {
    try {
        // Check admin auth
        const session = (await cookies()).get("admin_session")?.value;
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const parsed = await decrypt(session);
        if (!parsed || parsed.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch all categories
        const categoriesSnapshot = await db.collection("categories").orderBy("createdAt", "desc").get();

        // For each category, get review stats
        const categoriesWithStats = await Promise.all(
            categoriesSnapshot.docs.map(async (doc) => {
                const categoryData = doc.data();
                const categoryId = doc.id;

                // Get reviews subcollection
                const reviewsSnapshot = await db
                    .collection("categories")
                    .doc(categoryId)
                    .collection("reviews")
                    .get();

                const reviews = reviewsSnapshot.docs.map(r => r.data());
                const totalReviews = reviews.length;

                let averageRating = 0;
                if (totalReviews > 0) {
                    const sumRatings = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
                    averageRating = sumRatings / totalReviews;
                }

                return {
                    id: categoryId,
                    ...categoryData,
                    totalReviews,
                    averageRating,
                    playCount: categoryData.playCount || 0
                };
            })
        );

        return NextResponse.json(categoriesWithStats);
    } catch (error) {
        console.error("Error fetching categories with stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function GET(request: Request) {
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

        // Get category filter from query params
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");

        let totalQuestions = 0;
        let totalViews = 0;
        let totalSkips = 0;
        let avgSkipRate = 0;

        let topViewed = [];
        let mostSkipped = [];
        let highestSkipRate = [];
        let trending = [];
        let categoryStats: any[] = [];

        if (categoryId) {
            // Filter by category - Fetch all questions for this category (usually < 100)
            const questionsSnapshot = await db.collection("questions").where("categoryId", "==", categoryId).get();
            const questions = questionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            totalQuestions = questions.length;
            const totalReveals = questions.reduce((sum: number, q: any) => sum + (q.viewCount || 0), 0);
            totalSkips = questions.reduce((sum: number, q: any) => sum + (q.skipCount || 0), 0);
            totalViews = totalReveals + totalSkips;
            avgSkipRate = totalViews > 0 ? Number(((totalSkips / totalViews) * 100).toFixed(1)) : 0;

            // Sort in memory for single category (small dataset)
            topViewed = [...questions].sort((a: any, b: any) => (b.viewCount || 0) - (a.viewCount || 0)).slice(0, 10);
            mostSkipped = [...questions].sort((a: any, b: any) => (b.skipCount || 0) - (a.skipCount || 0)).slice(0, 10);
            highestSkipRate = [...questions]
                .map((q: any) => {
                    const views = (q.viewCount || 0);
                    const skips = (q.skipCount || 0);
                    const impressions = views + skips;
                    return { ...q, impressions, skipRate: impressions > 0 ? (skips / impressions) * 100 : 0 };
                })
                .filter((q: any) => q.impressions >= 5)
                .sort((a: any, b: any) => b.skipRate - a.skipRate)
                .slice(0, 10);

            // Trending for category
            trending = [...questions].sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0)).slice(0, 10);

        } else {
            // Global Stats - Use Optimized Queries

            // 1. Summary Stats (Estimate or Aggregated)
            // For total questions, we can use count()
            const countSnapshot = await db.collection("questions").count().get();
            totalQuestions = countSnapshot.data().count;

            // For total views/skips, we sum up Category stats
            const categoriesSnapshot = await db.collection("categories").get();
            let globalReveals = 0;

            categoryStats = await Promise.all(categoriesSnapshot.docs.map(async (catDoc) => {
                const catData = catDoc.data();
                const catSkips = catData.totalQuestionSkips || 0;
                const catReveals = catData.totalQuestionViews || 0;
                const catImpressions = catReveals + catSkips;
                const catAvgSkipRate = catImpressions > 0 ? ((catSkips / catImpressions) * 100).toFixed(1) : 0;

                // Count questions per category efficiently
                const qCountSnap = await db.collection("questions").where("categoryId", "==", catDoc.id).count().get();
                const catTotalQuestions = qCountSnap.data().count;

                globalReveals += catReveals;
                totalSkips += catSkips;

                return {
                    categoryId: catDoc.id,
                    categoryName: catData.title_en,
                    totalQuestions: catTotalQuestions,
                    totalSkips: catSkips,
                    avgSkipRate: Number(catAvgSkipRate),
                    playCount: catData.playCount || 0,
                    visitCount: catData.visitCount || 0
                };
            }));

            totalViews = globalReveals + totalSkips;
            avgSkipRate = totalViews > 0 ? Number(((totalSkips / totalViews) * 100).toFixed(1)) : 0;

            // 2. Top Viewed
            const topViewedSnap = await db.collection("questions").orderBy("viewCount", "desc").limit(10).get();
            topViewed = topViewedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 3. Most Skipped
            const mostSkippedSnap = await db.collection("questions").orderBy("skipCount", "desc").limit(10).get();
            mostSkipped = mostSkippedSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 4. Highest Skip Rate (Try/Catch for missing index)
            try {
                // Requires composite index: impressions ASC, skipRate DESC
                // If missing, fallback to simple sort or empty
                const highestSkipRateSnap = await db.collection("questions")
                    .where("impressions", ">=", 5)
                    .orderBy("skipRate", "desc")
                    .limit(10)
                    .get();
                highestSkipRate = highestSkipRateSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (e) {
                console.warn("Missing index for highestSkipRate, falling back to simple sort");
                const simpleSnap = await db.collection("questions").orderBy("skipRate", "desc").limit(10).get();
                highestSkipRate = simpleSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }

            // 5. Trending
            const trendingSnap = await db.collection("questions").orderBy("popularityScore", "desc").limit(10).get();
            trending = trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        return NextResponse.json({
            summary: {
                totalQuestions,
                totalViews,
                totalSkips,
                avgSkipRate
            },
            topViewed,
            mostSkipped,
            highestSkipRate,
            trending,
            categoryStats
        });
    } catch (error) {
        console.error("Error fetching analytics:", error);
        return NextResponse.json(
            { error: "Failed to fetch analytics" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        console.log("=== Review API Called ===");
        const { id } = await params;
        const body = await request.json();
        const { rating, comment } = body;
        console.log("Category ID:", id);
        console.log("Rating:", rating, "Comment:", comment);

        if (!id || !rating) {
            console.log("Missing required fields");
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Require login to submit review
        const sessionCookie = (await cookies()).get("member_session")?.value;
        console.log("Session cookie exists:", !!sessionCookie);

        if (!sessionCookie) {
            console.log("No session cookie - unauthorized");
            return NextResponse.json({ error: "Login required to submit review" }, { status: 401 });
        }

        const parsed = await decrypt(sessionCookie);
        console.log("Parsed session:", parsed);

        if (!parsed || parsed.type !== "member") {
            console.log("Invalid session type");
            return NextResponse.json({ error: "Invalid session" }, { status: 401 });
        }

        const memberId = parsed.id || "";
        // Ensure memberName is never undefined - use fallback values
        const memberName = parsed.displayName || parsed.username || parsed.email || "Member";
        console.log("Member ID:", memberId, "Name:", memberName);

        const categoryRef = db.collection("categories").doc(id);

        // Run transaction to update average rating safely
        console.log("Starting transaction...");
        await db.runTransaction(async (transaction) => {
            const categoryDoc = await transaction.get(categoryRef);
            console.log("Category exists:", categoryDoc.exists);

            if (!categoryDoc.exists) {
                throw new Error("Category not found");
            }

            const data = categoryDoc.data();
            const currentTotal = data?.totalReviews || 0;
            const currentAvg = data?.averageRating || 0;
            console.log("Current stats - Total:", currentTotal, "Avg:", currentAvg);

            const newTotal = currentTotal + 1;
            const newAvg = ((currentAvg * currentTotal) + rating) / newTotal;
            console.log("New stats - Total:", newTotal, "Avg:", newAvg);

            // Add review to subcollection
            const reviewRef = categoryRef.collection("reviews").doc();
            console.log("Creating review doc:", reviewRef.id);

            transaction.set(reviewRef, {
                categoryId: id,
                userId: memberId,
                userName: memberName,
                rating: rating,
                comment: comment || "",
                createdAt: new Date().toISOString()
            });

            // Update category stats - use set with merge to handle missing fields
            console.log("Updating category stats...");
            transaction.set(categoryRef, {
                totalReviews: newTotal,
                averageRating: newAvg
            }, { merge: true });
        });

        console.log("Transaction completed successfully");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error submitting review:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        return NextResponse.json(
            { error: "Failed to submit review", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const reviewsSnapshot = await db.collection("categories")
            .doc(id)
            .collection("reviews")
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const reviews = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json(reviews);
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get("categoryId");
        const search = searchParams.get("search");
        const sortBy = searchParams.get("sortBy") || "createdAt";
        const sortOrder = searchParams.get("sortOrder") || "asc";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const offset = (page - 1) * limit;

        let query: FirebaseFirestore.Query = db.collection("questions");

        // Filter by category
        if (categoryId) {
            query = query.where("categoryId", "==", categoryId);
        }

        // If search is present, we must fetch all to filter (Firestore limitation)
        if (search && search.trim()) {
            let snapshot = await query.get();
            let questions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            const searchLower = search.toLowerCase().trim();
            questions = questions.filter((q) => {
                const contentTh = (q.content_th || "").toLowerCase();
                const contentEn = (q.content_en || "").toLowerCase();
                return contentTh.includes(searchLower) || contentEn.includes(searchLower);
            });

            // Sort in memory
            questions.sort((a, b) => {
                let aVal, bVal;
                if (sortBy === "content_th" || sortBy === "content_en") {
                    aVal = (a[sortBy] || "").toLowerCase();
                    bVal = (b[sortBy] || "").toLowerCase();
                } else {
                    aVal = a[sortBy];
                    bVal = b[sortBy];
                }
                if (sortOrder === "desc") {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });

            const total = questions.length;
            const paginatedQuestions = questions.slice(offset, offset + limit);

            return NextResponse.json({
                data: paginatedQuestions,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            });
        } else {
            // Fallback: Fetch all for category and sort/paginate in memory
            // This avoids the need for composite indexes (categoryId + sortBy) which cause errors if missing
            // Since we enforced a 100-question limit, this is performant enough.

            const snapshot = await query.get();
            let questions = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as any[];

            // Sort in memory
            questions.sort((a, b) => {
                let aVal, bVal;
                if (sortBy === "content_th" || sortBy === "content_en") {
                    aVal = (a[sortBy] || "").toLowerCase();
                    bVal = (b[sortBy] || "").toLowerCase();
                } else {
                    aVal = a[sortBy];
                    bVal = b[sortBy];
                }
                if (sortOrder === "desc") {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                } else {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                }
            });

            const total = questions.length;
            const paginatedQuestions = questions.slice(offset, offset + limit);

            return NextResponse.json({
                data: paginatedQuestions,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            });
        }
    } catch (error) {
        console.error("Error fetching questions:", error);
        return NextResponse.json(
            { error: "Failed to fetch questions" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.categoryId || !data.categoryId.trim()) {
            return NextResponse.json(
                { error: "Category ID is required" },
                { status: 400 }
            );
        }

        // Ensure at least one content field is provided and not empty
        const contentTh = data.content_th?.trim() || "";
        const contentEn = data.content_en?.trim() || "";

        if (!contentTh && !contentEn) {
            return NextResponse.json(
                { error: "At least one content field (TH or EN) must be provided" },
                { status: 400 }
            );
        }

        const newQuestion = {
            categoryId: data.categoryId.trim(),
            content_th: contentTh,
            content_en: contentEn,
            createdAt: new Date().toISOString(),
        };

        // Check if category has reached the limit (100 questions)
        const questionsSnapshot = await db.collection("questions")
            .where("categoryId", "==", newQuestion.categoryId)
            .count()
            .get();

        if (questionsSnapshot.data().count >= 100) {
            return NextResponse.json(
                { error: "Category has reached the limit of 100 questions" },
                { status: 400 }
            );
        }

        const docRef = await db.collection("questions").add(newQuestion);

        return NextResponse.json({ id: docRef.id, ...newQuestion });
    } catch (error) {
        console.error("Error creating question:", error);
        return NextResponse.json(
            { error: "Failed to create question" },
            { status: 500 }
        );
    }
}


export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await db.collection("questions").doc(id).update({
            ...updateData,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true, id, ...updateData });
    } catch (error) {
        console.error("Error updating question:", error);
        return NextResponse.json(
            { error: "Failed to update question" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        await db.collection("questions").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting question:", error);
        return NextResponse.json(
            { error: "Failed to delete question" },
            { status: 500 }
        );
    }
}

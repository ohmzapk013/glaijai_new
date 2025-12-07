import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

let categoriesCache: { data: any[], timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
    try {
        const now = Date.now();
        if (categoriesCache && (now - categoriesCache.timestamp < CACHE_TTL)) {
            return NextResponse.json(categoriesCache.data);
        }

        const snapshot = await db.collection("categories").orderBy("createdAt", "desc").get();

        // Fetch categories with stats
        const categoriesWithStats = snapshot.docs.map((doc) => {
            const categoryData = doc.data();

            return {
                id: doc.id,
                ...categoryData,
                // Include stats if they exist, otherwise use defaults
                averageRating: categoryData.averageRating || 0,
                totalReviews: categoryData.totalReviews || 0,
                playCount: categoryData.playCount || 0, // Number of times played to completion
                totalViews: categoryData.visitCount || 0, // Number of times visited
                totalQuestionViews: categoryData.totalQuestionViews || 0,
                totalQuestionSkips: categoryData.totalQuestionSkips || 0
            };
        });

        categoriesCache = { data: categoriesWithStats, timestamp: Date.now() };

        return NextResponse.json(categoriesWithStats);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.slug || !data.slug.trim()) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        if (!data.title_th || !data.title_th.trim()) {
            return NextResponse.json({ error: "Thai title is required" }, { status: 400 });
        }

        if (!data.title_en || !data.title_en.trim()) {
            return NextResponse.json({ error: "English title is required" }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(data.slug.trim())) {
            return NextResponse.json(
                { error: "Slug must contain only lowercase letters, numbers, and hyphens" },
                { status: 400 }
            );
        }

        // Check if slug already exists
        const existingDoc = await db.collection("categories").doc(data.slug.trim()).get();
        if (existingDoc.exists) {
            return NextResponse.json(
                { error: "A category with this slug already exists" },
                { status: 409 }
            );
        }

        const newCategory = {
            slug: data.slug.trim(),
            title_th: data.title_th.trim(),
            title_en: data.title_en.trim(),
            description_th: data.description_th?.trim() || "",
            description_en: data.description_en?.trim() || "",
            iconClass: data.iconClass?.trim() || "",
            iconColor: data.iconColor?.trim() || "pink-500",
            instructions_th: data.instructions_th?.trim() || "",
            instructions_en: data.instructions_en?.trim() || "",
            createdAt: new Date().toISOString(),
        };

        // Use slug as document ID
        await db.collection("categories").doc(newCategory.slug).set(newCategory);

        return NextResponse.json({ id: newCategory.slug, ...newCategory });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const data = await request.json();
        const { id, slug, ...updateData } = data;

        if (!id || !slug) {
            return NextResponse.json({ error: "ID and Slug are required" }, { status: 400 });
        }

        // 1. If slug hasn't changed, just update the document
        if (id === slug) {
            await db.collection("categories").doc(id).update({
                ...updateData,
                slug: slug, // Ensure slug is consistent
            });
            // Return full updated object
            return NextResponse.json({
                id: slug,
                slug,
                ...updateData
            });
        }

        // 2. If slug HAS changed, we need to migrate
        // Check if new slug already exists
        const newSlugDoc = await db.collection("categories").doc(slug).get();
        if (newSlugDoc.exists) {
            return NextResponse.json({ error: "New slug already exists" }, { status: 409 });
        }

        // Get old category data
        const oldCategoryDoc = await db.collection("categories").doc(id).get();
        if (!oldCategoryDoc.exists) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        const oldCategoryData = oldCategoryDoc.data();

        // Start a batch
        const batch = db.batch();

        const newCategoryData = {
            ...oldCategoryData,
            ...updateData,
            slug: slug,
            id: slug,
        };

        // Create new category
        const newCategoryRef = db.collection("categories").doc(slug);
        batch.set(newCategoryRef, newCategoryData);

        // Find all questions with old categoryId
        const questionsSnapshot = await db.collection("questions").where("categoryId", "==", id).get();
        questionsSnapshot.docs.forEach((doc) => {
            batch.update(doc.ref, { categoryId: slug });
        });

        // Delete old category
        const oldCategoryRef = db.collection("categories").doc(id);
        batch.delete(oldCategoryRef);

        // Commit batch
        await batch.commit();

        return NextResponse.json(newCategoryData);

    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
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

        await db.collection("categories").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}

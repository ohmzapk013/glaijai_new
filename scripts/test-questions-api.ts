import { db } from "@/lib/firebaseAdmin";

async function testQuestionsApi() {
    try {
        console.log("Fetching categories...");
        const categoriesSnapshot = await db.collection("categories").limit(1).get();

        if (categoriesSnapshot.empty) {
            console.log("No categories found.");
            return;
        }

        const categoryId = categoriesSnapshot.docs[0].id;
        console.log(`Testing with category: ${categoryId}`);

        // Simulate the API logic
        const query = db.collection("questions").where("categoryId", "==", categoryId);
        const snapshot = await query.get();

        console.log(`Found ${snapshot.size} questions in Firestore for this category.`);

        const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Simulate pagination
        const page = 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const paginatedQuestions = questions.slice(offset, offset + limit);

        console.log(`Paginated questions (Page 1, Limit 10): ${paginatedQuestions.length}`);
        if (paginatedQuestions.length > 0) {
            console.log("Sample question:", JSON.stringify(paginatedQuestions[0], null, 2));
        }

    } catch (error) {
        console.error("Error testing API:", error);
    }
}

testQuestionsApi();

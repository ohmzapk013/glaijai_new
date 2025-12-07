
import { db } from "../lib/firebaseAdmin";

async function checkIndex() {
    try {
        console.log("Testing Questions Query...");
        // Simulate the query from app/api/questions/route.ts
        // query.where("categoryId", "==", "some-id").orderBy("createdAt", "asc")

        const snapshot = await db.collection("questions")
            .where("categoryId", "==", "test-category-id")
            .orderBy("createdAt", "asc")
            .limit(1)
            .get();

        console.log("Query successful! Docs found:", snapshot.size);
    } catch (error: any) {
        console.error("Query failed!");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        if (error.details) {
            console.error("Error details:", error.details);
        }
    }
}

checkIndex();

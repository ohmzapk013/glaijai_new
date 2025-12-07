import * as dotenv from 'dotenv';
import path from 'path';

// Try loading from absolute path
const envPath = path.resolve(process.cwd(), '.env.local');
console.log("Loading env from:", envPath);
dotenv.config({ path: envPath });

console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "Loaded" : "Missing");
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "Loaded" : "Missing");

async function checkCounts() {
    const { db } = await import("../lib/firebaseAdmin");
    try {
        const questionsSnapshot = await db.collection("questions").get();
        console.log(`Found ${questionsSnapshot.size} questions.`);

        let totalSkips = 0;
        let totalViews = 0;

        questionsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Question ${doc.id}: Views=${data.viewCount || 0}, Skips=${data.skipCount || 0}`);
            totalSkips += (data.skipCount || 0);
            totalViews += (data.viewCount || 0);
        });

        console.log("-----------------------------------");
        console.log(`Total Views: ${totalViews}`);
        console.log(`Total Skips: ${totalSkips}`);

    } catch (error) {
        console.error("Error checking counts:", error);
    }
}

checkCounts();

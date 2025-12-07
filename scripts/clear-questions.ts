import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error("Error: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are missing in .env");
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    });
}

const db = admin.firestore();

async function clearQuestions() {
    console.log("Starting to clear questions...");
    const questionsRef = db.collection("questions");
    const snapshot = await questionsRef.get();

    if (snapshot.empty) {
        console.log("No questions found to delete.");
        return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
    });

    await batch.commit();
    console.log(`Successfully deleted ${count} questions.`);
}

clearQuestions().catch(console.error);

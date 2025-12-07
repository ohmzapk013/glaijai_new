import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { FieldValue } from "firebase-admin/firestore";

const envPath = path.resolve(process.cwd(), ".env.local");
console.log("Reading .env.local from:", envPath);

try {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
    console.log("Environment variables loaded manually.");
} catch (e) {
    console.error("Failed to read .env.local:", e);
}

async function removeIconUrl() {
    // Dynamic import to ensure env vars are loaded first
    const { db } = await import("../lib/firebaseAdmin");

    console.log("Checking for iconUrl in categories...");
    try {
        const categoriesSnapshot = await db.collection("categories").get();
        let updatedCount = 0;

        const batch = db.batch();
        let batchCount = 0;

        for (const doc of categoriesSnapshot.docs) {
            const data = doc.data();
            if (data.iconUrl !== undefined) {
                console.log(`Found iconUrl in category: ${doc.id} (${data.title_en})`);
                const docRef = db.collection("categories").doc(doc.id);
                batch.update(docRef, {
                    iconUrl: FieldValue.delete()
                });
                updatedCount++;
                batchCount++;

                // Commit batch every 400 operations
                if (batchCount >= 400) {
                    await batch.commit();
                    batchCount = 0;
                }
            }
        }

        if (batchCount > 0) {
            await batch.commit();
        }

        if (updatedCount > 0) {
            console.log(`Successfully removed iconUrl from ${updatedCount} categories.`);
        } else {
            console.log("No categories found with iconUrl.");
        }

    } catch (error) {
        console.error("Error removing iconUrl:", error);
    }
}

removeIconUrl();

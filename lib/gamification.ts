import { db } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function updateGamificationStats(memberId: string, action: "view_question" | "complete_category" | "create_pack", metadata: any = {}) {
    if (!memberId) return;

    const memberRef = db.collection("members").doc(memberId);
    const statsRef = memberRef; // We can store stats directly on member or in a subcollection

    try {
        // 1. Update Stats
        let updateData: any = {};

        if (action === "view_question") {
            updateData["stats.questionsAnswered"] = FieldValue.increment(1);
            updateData["points"] = FieldValue.increment(10); // 10 points per question
        } else if (action === "complete_category") {
            updateData["stats.categoriesCompleted"] = FieldValue.arrayUnion(metadata.categoryId);
            updateData["points"] = FieldValue.increment(50);
        } else if (action === "create_pack") {
            updateData["stats.packsCreated"] = FieldValue.increment(1);
            updateData["points"] = FieldValue.increment(100);
        }

        // Update last played for streak
        const today = new Date().toISOString().split('T')[0];
        updateData["streak.lastPlayedDate"] = today;

        await memberRef.set(updateData, { merge: true });

        // 2. Check Achievements
        await checkAchievements(memberId, action);

    } catch (error) {
        console.error("Error updating gamification stats:", error);
    }
}

async function checkAchievements(memberId: string, action: string) {
    // Fetch user stats
    const memberDoc = await db.collection("members").doc(memberId).get();
    const memberData = memberDoc.data();
    if (!memberData) return;

    const stats = memberData.stats || {};

    // Fetch all achievements
    const achievementsSnapshot = await db.collection("achievements").get();
    const achievements = achievementsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // Fetch user's current achievements
    const userAchievementsSnapshot = await db.collection("member_achievements")
        .where("memberId", "==", memberId)
        .get();
    const userAchievements = new Set(userAchievementsSnapshot.docs.map(doc => doc.data().achievementId));

    const batch = db.batch();
    let hasUpdates = false;

    for (const achievement of achievements) {
        if (userAchievements.has(achievement.id)) continue; // Already unlocked

        let isUnlocked = false;
        let progress = 0;

        const { type, target, metric } = achievement.requirement;

        if (metric === "questions_answered") {
            progress = stats.questionsAnswered || 0;
            if (progress >= target) isUnlocked = true;
        } else if (metric === "categories_completed") {
            progress = (stats.categoriesCompleted || []).length;
            if (progress >= target) isUnlocked = true;
        } else if (metric === "packs_created") {
            progress = stats.packsCreated || 0;
            if (progress >= target) isUnlocked = true;
        }
        // Add streak logic here later

        // Update progress or unlock
        const userAchievementRef = db.collection("member_achievements").doc(`${memberId}_${achievement.id}`);
        batch.set(userAchievementRef, {
            memberId,
            achievementId: achievement.id,
            progress,
            isCompleted: isUnlocked,
            unlockedAt: isUnlocked ? FieldValue.serverTimestamp() : null,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        hasUpdates = true;
    }

    if (hasUpdates) {
        await batch.commit();
    }
}

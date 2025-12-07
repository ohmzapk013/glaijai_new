import { db } from "./firebaseAdmin";

export type NotificationType = 'new_user' | 'new_pack' | 'system';

export async function createNotification(
    type: NotificationType,
    message: string,
    relatedId?: string
) {
    try {
        await db.collection("notifications").add({
            type,
            message,
            isRead: false,
            createdAt: new Date().toISOString(),
            relatedId: relatedId || null
        });
        console.log(`Notification created: [${type}] ${message}`);
    } catch (error) {
        console.error("Error creating notification:", error);
    }
}

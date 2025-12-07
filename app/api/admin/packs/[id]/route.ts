import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { getSession } from "@/lib/auth";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session || session.type !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await db.collection("custom_packs").doc(id).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting pack:", error);
        return NextResponse.json(
            { error: "Failed to delete pack" },
            { status: 500 }
        );
    }
}

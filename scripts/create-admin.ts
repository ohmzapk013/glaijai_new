import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "../lib/firebaseAdmin";
import bcrypt from "bcryptjs";

async function createAdmin() {
    const username = "admin";
    const password = "password123";
    const permissions = ["dashboard", "categories", "members", "users"];

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.collection("users").doc(username).set({
            username,
            password: hashedPassword,
            permissions,
            createdAt: new Date().toISOString(),
        });

        console.log(`Admin user '${username}' created successfully.`);
    } catch (error) {
        console.error("Error creating admin user:", error);
    }
}

createAdmin();

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = "secret-key-change-this-in-production"; // In prod, use process.env.JWT_SECRET
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, key, {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const session = (await cookies()).get("admin_session")?.value;
    if (!session) return null;
    return await decrypt(session);
}

export async function updateSession(request: Request) {
    const session = request.headers.get("cookie")?.split("; ").find(row => row.startsWith("admin_session="))?.split("=")[1];
    if (!session) return;

    // Refresh logic if needed, for now just return
    const parsed = await decrypt(session);
    if (!parsed) return;

    // Extend session here if desired
}

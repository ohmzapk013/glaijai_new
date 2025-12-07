import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as bcrypt from "bcryptjs";

dotenv.config();

if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.error(
        "Error: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are missing in .env"
    );
    console.error(
        "Please add them from your Firebase Service Account JSON file."
    );
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

const categories = [
    {
        id: "you-and-me",
        title_en: "You & Me",
        title_th: "รู้จักรู้รัก กัน",
        description_en: "Questions to get to know each other deeper and more charmingly.",
        description_th: "คำถามเพื่อการทำความรู้จักกันอย่างลึกซึ้ง มีเสน่ห์ยิ่งขึ้น",
        iconName: "Heart",
        iconColor: "text-pink-500",
    },
    {
        id: "love-lens",
        title_en: "Love Lens",
        title_th: "มุมมองและความคาดหวังในความรัก",
        description_en: "Questions to understand each other's views and expectations on love.",
        description_th: "คำถามเพื่อเข้าใจมุมมองและความคาดหวังในความรัก ของกันและกัน",
        iconName: "Eye",
        iconColor: "text-purple-500",
    },
    {
        id: "real-talk",
        title_en: "Real Talk",
        title_th: "ความเปิดเผย บางอย่างที่ยังไม่เคยพูด",
        description_en: "Questions to open up and share secrets or untold stories.",
        description_th: "คำถามเพื่อเปิดใจและแบ่งปันความลับหรือเรื่องราว ที่ยังไม่เคยพูด",
        iconName: "MessageCircle",
        iconColor: "text-rose-500",
    },
    {
        id: "growing-together",
        title_en: "Growing Together",
        title_th: "การเติบโตร่วมกัน",
        description_en: "Questions for mutual growth and self-improvement in the future.",
        description_th: "คำถามเพื่อการเติบโตและพัฒนาตนเองร่วมกัน ในอนาคต",
        iconName: "Wine",
        iconColor: "text-pink-600",
    },
    {
        id: "intimacy-and-sex",
        title_en: "Intimacy & Sex",
        title_th: "ความใกล้ชิดทางกายและเสน่ห์",
        description_en: "Questions to understand needs and preferences regarding physical intimacy.",
        description_th: "คำถามเพื่อเข้าใจความต้องการและความชอบ ด้านความใกล้ชิดทางกายและเสน่ห์ของกัน",
        iconName: "HeartHandshake",
        iconColor: "text-red-500",
    },
    {
        id: "family-ties",
        title_en: "Family Ties",
        title_th: "ความสัมพันธ์ในครอบครัว",
        description_en: "Questions to understand and acknowledge each other's family relationships.",
        description_th: "คำถามเพื่อทำความเข้าใจ และรับรู้ความสัมพันธ์ในครอบครัว ของกันและกัน",
        iconName: "Users",
        iconColor: "text-orange-500",
    },
    {
        id: "self-and-soul",
        title_en: "Self & Soul",
        title_th: "อยู่กับตัวเองอย่างมีสติ",
        description_en: "Questions for self-understanding and caring for each other's mental health.",
        description_th: "คำถามเพื่อการทำความเข้าใจตัวเองและการดูแล สุขภาพจิตของกันและกัน",
        iconName: "User",
        iconColor: "text-indigo-500",
    },
    {
        id: "friendship-flow",
        title_en: "Friendship Flow",
        title_th: "สำรวจความสัมพันธ์ในกลุ่มมิตรภาพ",
        description_en: "Questions for playing with friends, both new and old.",
        description_th: "คำถามสำหรับการเล่นกับกลุ่มเพื่อน ใช้ได้ทั้งเพื่อนใหม่ และเพื่อนเก่าที่ต้องการเพิ่มความสนิทสนม กันมากขึ้น",
        iconName: "Users",
        iconColor: "text-blue-500",
    },
    {
        id: "life-chapters",
        title_en: "Life Chapters",
        title_th: "การเติบโตของชีวิต",
        description_en: "Questions to review and share life experiences, past and future.",
        description_th: "คำถามเพื่อการทบทวนและแบ่งปันประสบการณ์ชีวิต ที่ผ่านมาและในอนาคต",
        iconName: "Book",
        iconColor: "text-teal-500",
    },
    {
        id: "healing-talk",
        title_en: "Healing Talk",
        title_th: "บทสนทนาเพื่อเยียวยา",
        description_en: "Questions for healing, taking a deep breath, and letting go of stress.",
        description_th: "คำถามเพื่อการเยียวยา หายใจลึกๆ และปล่อยวาง ความเครียดหรือความทุกข์ใจที่มีอยู่ในใจ ของกัน",
        iconName: "Target",
        iconColor: "text-green-500",
    },
    {
        id: "meaning-and-purpose",
        title_en: "Meaning & Purpose",
        title_th: "ความหมายของชีวิต",
        description_en: "Questions to find the meaning and purpose of life.",
        description_th: "คำถามเพื่อการค้นหาความหมายและจุดประสงค์ของชีวิต",
        iconName: "Target",
        iconColor: "text-violet-500",
    },
];

const questions: Record<string, { th: string; en: string }[]> = {
    "you-and-me": [
        { th: "อะไรคือความทรงจำแรกที่คุณมีเกี่ยวกับฉัน?", en: "What is your first memory of me?" },
        { th: "คุณคิดว่าอะไรคือจุดเด่นของฉันที่คุณชอบที่สุด?", en: "What do you think is my best trait?" },
        { th: "ถ้าเราไปเที่ยวด้วยกันได้ สถานที่ไหนที่คุณอยากไปที่สุด?", en: "If we could travel anywhere together, where would you want to go?" },
        { th: "อะไรคือสิ่งที่ทำให้คุณรู้สึกว่าเราเข้ากันได้ดี?", en: "What makes you feel like we get along well?" },
        { th: "คุณมีความฝันอะไรที่อยากบอกฉัน?", en: "What is a dream you want to tell me about?" },
    ],
    "love-lens": [
        { th: "ความรักในความคิดของคุณคืออะไร?", en: "What does love mean to you?" },
        { th: "คุณคิดว่าอะไรคือสิ่งสำคัญที่สุดในความสัมพันธ์?", en: "What do you think is the most important thing in a relationship?" },
        { th: "คุณเคยมีความคาดหวังในความรักอย่างไร?", en: "What expectations have you had in love?" },
        { th: "อะไรคือสัญญาณที่บอกคุณว่าคุณรักใครสักคน?", en: "What is a sign that tells you you love someone?" },
    ],
    "real-talk": [
        { th: "มีอะไรที่คุณอยากบอกฉันแต่ยังไม่กล้าพูด?", en: "Is there anything you want to tell me but haven't dared to yet?" },
        { th: "ความกลัวที่ลึกที่สุดของคุณคืออะไร?", en: "What is your deepest fear?" },
        { th: "คุณเคยทำอะไรที่รู้สึกเสียใจจนถึงทุกวันนี้?", en: "Have you ever done something you regret to this day?" },
        { th: "อะไรคือความลับที่คุณไม่เคยบอกใคร?", en: "What is a secret you've never told anyone?" },
    ],
    "growing-together": [
        { th: "คุณเห็นตัวเองในอีก 5 ปีข้างหน้าเป็นอย่างไร?", en: "Where do you see yourself in 5 years?" },
        { th: "อะไรคือเป้าหมายในชีวิตที่คุณอยากบรรลุ?", en: "What life goals do you want to achieve?" },
        { th: "คุณคิดว่าเราจะเติบโตไปด้วยกันอย่างไร?", en: "How do you think we will grow together?" },
        { th: "ทักษะอะไรที่คุณอยากพัฒนาในตัวเอง?", en: "What skills do you want to develop in yourself?" },
    ],
    "intimacy-and-sex": [
        { th: "อะไรทำให้คุณรู้สึกใกล้ชิดกับใครสักคน?", en: "What makes you feel close to someone?" },
        { th: "คุณคิดอย่างไรกับการแสดงความรักทางกาย?", en: "How do you feel about physical displays of affection?" },
        { th: "อะไรคือสิ่งที่ทำให้คุณรู้สึกถูกรัก?", en: "What makes you feel loved?" },
        { th: "คุณคิดว่าความสัมพันธ์ทางกายสำคัญแค่ไหน?", en: "How important do you think physical intimacy is?" },
    ],
    "family-ties": [
        { th: "ครอบครัวของคุณมีอิทธิพลต่อชีวิตคุณอย่างไร?", en: "How has your family influenced your life?" },
        { th: "ความสัมพันธ์กับพ่อแม่ของคุณเป็นอย่างไร?", en: "How is your relationship with your parents?" },
        { th: "มีบทเรียนอะไรจากครอบครัวที่คุณจะนำไปใช้?", en: "What lessons from your family will you apply?" },
        { th: "คุณเห็นอนาคตครอบครัวของคุณเองอย่างไร?", en: "How do you see your own future family?" },
    ],
    "self-and-soul": [
        { th: "อะไรคือสิ่งที่ทำให้คุณรู้สึกมีความสุข?", en: "What makes you feel happy?" },
        { th: "คุณดูแลสุขภาพจิตของตัวเองอย่างไร?", en: "How do you take care of your mental health?" },
        { th: "มีช่วงเวลาไหนที่คุณรู้สึกว่าเข้าใจตัวเองมากที่สุด?", en: "When do you feel you understand yourself the most?" },
        { th: "คุณมีวิธีจัดการความเครียดอย่างไร?", en: "How do you handle stress?" },
    ],
    "friendship-flow": [
        { th: "มิตรภาพที่ดีสำหรับคุณคืออะไร?", en: "What does good friendship mean to you?" },
        { th: "เพื่อนที่ดีที่สุดของคุณคือใคร และทำไม?", en: "Who is your best friend and why?" },
        { th: "คุณชอบใช้เวลากับเพื่อนแบบไหน?", en: "What kind of friends do you like spending time with?" },
        { th: "มีเรื่องอะไรที่คุณไม่เคยบอกเพื่อน?", en: "Is there anything you've never told your friends?" },
    ],
    "life-chapters": [
        { th: "ช่วงเวลาไหนในชีวิตที่คุณรู้สึกภูมิใจที่สุด?", en: "What moment in your life are you most proud of?" },
        { th: "ถ้าย้อนเวลากลับไปได้ คุณจะเปลี่ยนอะไร?", en: "If you could go back in time, what would you change?" },
        { th: "บทเรียนสำคัญจากอดีตที่คุณเรียนรู้คืออะไร?", en: "What important lesson have you learned from the past?" },
        { th: "คุณอยากให้อนาคตของคุณเป็นอย่างไร?", en: "What do you want your future to look like?" },
    ],
    "healing-talk": [
        { th: "อะไรคือสิ่งที่ทำให้คุณเครียดในตอนนี้?", en: "What is stressing you out right now?" },
        { th: "คุณมีวิธีทำให้ใจสงบอย่างไร?", en: "How do you calm your mind?" },
        { th: "มีอะไรที่คุณต้องการปล่อยวาง?", en: "Is there anything you want to let go of?" },
        { th: "คุณรู้สึกอย่างไรกับการให้อภัย?", en: "How do you feel about forgiveness?" },
    ],
    "meaning-and-purpose": [
        { th: "อะไรคือความหมายของชีวิตสำหรับคุณ?", en: "What is the meaning of life for you?" },
        { th: "คุณคิดว่าจุดประสงค์ของคุณในชีวิตคืออะไร?", en: "What do you think is your purpose in life?" },
        { th: "อะไรทำให้คุณรู้สึกว่าชีวิตมีค่า?", en: "What makes you feel that life is valuable?" },
        { th: "คุณอยากทิ้งอะไรไว้ให้โลกนี้?", en: "What do you want to leave behind for the world?" },
    ],
};

async function seed() {
    console.log("🌱 Starting seed...");

    // 1. Create Admin
    const adminRef = db.collection("admins").doc("admin");
    const adminDoc = await adminRef.get();
    if (!adminDoc.exists) {
        const passwordHash = await bcrypt.hash("password", 10);
        await adminRef.set({
            username: "admin",
            password_hash: passwordHash,
            createdAt: new Date().toISOString(),
        });
        console.log("✅ Admin user created (username: admin, password: password)");
    } else {
        console.log("ℹ️ Admin user already exists");
    }

    // 2. Create Categories
    for (const cat of categories) {
        const catRef = db.collection("categories").doc(cat.id);
        await catRef.set({
            ...cat,
            createdAt: new Date().toISOString(),
        });
        console.log(`✅ Category created: ${cat.title_en}`);
    }

    // 3. Create Questions
    for (const [catId, qs] of Object.entries(questions)) {
        for (const q of qs) {
            // Check if question exists to avoid duplicates (simple check by content_th)
            const qSnapshot = await db
                .collection("questions")
                .where("categoryId", "==", catId)
                .where("content_th", "==", q.th)
                .get();

            if (qSnapshot.empty) {
                await db.collection("questions").add({
                    content_th: q.th,
                    content_en: q.en,
                    categoryId: catId,
                    createdAt: new Date().toISOString(),
                });
                console.log(`✅ Question added to ${catId}: ${q.en.substring(0, 20)}...`);
            }
        }
    }

    console.log("🎉 Seeding complete!");
    process.exit(0);
}

seed().catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
});

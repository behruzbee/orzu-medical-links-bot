import { MongoClient, MongoClientOptions } from "mongodb"; // Добавьте MongoClientOptions
import { LinkItem, Branch } from "@/lib/types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Нет MONGODB_URI в переменных окружения");

// 👇 Настройки, чтобы не ждать 60 секунд, а падать сразу с ошибкой
const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 5000, // Тайм-аут подключения 5 секунд
    socketTimeoutMS: 10000,         // Тайм-аут сокета 10 секунд
    connectTimeoutMS: 10000,        // Тайм-аут соединения
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

console.log("⏳ (DB) Начало подключения...");

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options); // 👈 Добавили options
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options); // 👈 Добавили options
  clientPromise = client.connect();
}

async function getCollection() {
    try {
        console.log("⏳ (DB) Жду соединения...");
        const connection = await clientPromise;
        console.log("✅ (DB) Успешно подключено!");
        return connection.db("orzu_bot").collection<LinkItem>("links");
    } catch (e) {
        console.error("❌ (DB) ОШИБКА ПОДКЛЮЧЕНИЯ:", e);
        throw new Error("Database connection failed");
    }
}
// ... остальной код LinkRepository без изменений
export const LinkRepository = {
    async add(link: LinkItem) {
        const links = await getCollection();
        await links.insertOne({ ...link, clicks: 0 });
    },
    async delete(id: string) {
        const links = await getCollection();
        await links.deleteOne({ id: id });
    },
    async getByAdmin(adminId: number) {
        const links = await getCollection();
        return links.find({ adminId: adminId }).toArray();
    },
    async getLinksForUser(branch: Branch) {
        const links = await getCollection();
        return links.find({
            $or: [{ branch: branch }, { branch: Branch.ALL }]
        }).sort({ branch: 1, createdAt: -1 }).toArray();
    },
    async getById(id: string) {
        const links = await getCollection();
        return links.findOne({ id: id });
    },
    async incrementClick(id: string) {
        const links = await getCollection();
        await links.updateOne({ id: id }, { $inc: { clicks: 1 } });
    },
    async getTopLinks(limit: number = 5) {
        const links = await getCollection();
        return links.find().sort({ clicks: -1 }).limit(limit).toArray();
    }
};
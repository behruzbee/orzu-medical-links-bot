import { MongoClient, MongoClientOptions } from "mongodb";
import { LinkItem, Branch } from "@/lib/types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Нет MONGODB_URI в переменных окружения");

// 👇 ЖЕСТКИЕ НАСТРОЙКИ (Чтобы не висело 300 секунд)
const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 5000, // Тайм-аут 5 секунд (а не 300)
    socketTimeoutMS: 10000,         
    family: 4,                      // 👈 Принудительно используем IPv4 (важно для Vercel!)
    maxPoolSize: 1,                 // Для бота достаточно 1 подключения
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

console.log("⏳ (DB) Инициализация клиента (v2)..."); // Я изменил текст, чтобы мы увидели обновление в логах

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function getCollection() {
    try {
        console.log("⏳ (DB) Подключение к коллекции...");
        const connection = await clientPromise;
        console.log("✅ (DB) Успех!");
        return connection.db("orzu_bot").collection<LinkItem>("links");
    } catch (e: any) {
        console.error("❌ (DB) ОШИБКА:", e.message); // Покажет точную причину
        throw e;
    }
}

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
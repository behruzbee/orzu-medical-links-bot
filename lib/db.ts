import { MongoClient, MongoClientOptions } from "mongodb";
import { LinkItem, Branch } from "@/lib/types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Нет MONGODB_URI в переменных окружения");

const options: MongoClientOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 10000,
    family: 4,
    maxPoolSize: 1,
};

// Переменные для хранения клиента
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// 👇 ФУНКЦИЯ ПОДКЛЮЧЕНИЯ (Вместо кода на верхнем уровне)
async function getDbClient() {
    // Если уже подключено - возвращаем готовое
    if (clientPromise) return clientPromise;

    console.log("⏳ (DB) Создаю новое подключение...");
    
    if (process.env.NODE_ENV === "development") {
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri!, options);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise;
    } else {
        client = new MongoClient(uri!, options);
        clientPromise = client.connect();
    }
    
    return clientPromise!;
}

async function getCollection() {
    try {
        // Подключаемся только ЗДЕСЬ, когда нужна коллекция
        const connection = await getDbClient();
        return connection.db("orzu_bot").collection<LinkItem>("links");
    } catch (e: any) {
        console.error("❌ (DB) ОШИБКА ПОДКЛЮЧЕНИЯ:", e.message);
        throw new Error("Database connection failed");
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
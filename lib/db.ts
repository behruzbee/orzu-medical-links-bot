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

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// 🔌 Ленивая функция подключения
async function getDbConnection() {
    if (clientPromise) return clientPromise;

    console.log("🔌 (DB) Открываю соединение...");

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

export const LinkRepository = {
    async add(link: LinkItem) {
        const connection = await getDbConnection();
        await connection.db("orzu_bot").collection<LinkItem>("links").insertOne({ ...link, clicks: 0 });
    },
    async delete(id: string) {
        const connection = await getDbConnection();
        await connection.db("orzu_bot").collection<LinkItem>("links").deleteOne({ id: id });
    },
    async getByAdmin(adminId: number) {
        const connection = await getDbConnection();
        return connection.db("orzu_bot").collection<LinkItem>("links").find({ adminId: adminId }).toArray();
    },
    async getLinksForUser(branch: Branch) {
        const connection = await getDbConnection();
        return connection.db("orzu_bot").collection<LinkItem>("links").find({
            $or: [{ branch: branch }, { branch: Branch.ALL }]
        }).sort({ branch: 1, createdAt: -1 }).toArray();
    },
    async getById(id: string) {
        const connection = await getDbConnection();
        return connection.db("orzu_bot").collection<LinkItem>("links").findOne({ id: id });
    },
    async incrementClick(id: string) {
        const connection = await getDbConnection();
        await connection.db("orzu_bot").collection<LinkItem>("links").updateOne({ id: id }, { $inc: { clicks: 1 } });
    },
    async getTopLinks(limit: number = 5) {
        const connection = await getDbConnection();
        return connection.db("orzu_bot").collection<LinkItem>("links").find().sort({ clicks: -1 }).limit(limit).toArray();
    }
};
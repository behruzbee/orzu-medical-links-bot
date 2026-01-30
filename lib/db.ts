import { MongoClient } from "mongodb";
import { LinkItem, Branch } from "@/lib/types";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Нет MONGODB_URI в переменных окружения");

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Singleton паттерн для Next.js (чтобы не переполнять подключения в dev режиме)
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

async function getCollection() {
  const connection = await clientPromise;
  return connection.db("orzu_bot").collection<LinkItem>("links");
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
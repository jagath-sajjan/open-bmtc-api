import { MongoClient } from "mongodb";

const uri = process.env.MONGO_DB!;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!globalThis._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalThis._mongoClientPromise = client.connect();
}

clientPromise = globalThis._mongoClientPromise;

export default clientPromise;

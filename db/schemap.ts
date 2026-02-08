import { MongoClient } from "mongodb";
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGO_URI = process.env.MONGO_DB!;

async function printStructure() {
    const client = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });
    
    try {
        console.log('🔌 Attempting to connect...');
        await client.connect();
        console.log('✅ Connected successfully\n');
        
        const db = client.db('bmtc'); // Explicitly specify database
        
        console.log('📂 Database Structure\n');
        
        const collections = ['stops', 'routes', 'aggregated'];
        
        for (const collName of collections) {
            try {
                const count = await db.collection(collName).countDocuments();
                console.log(`├── ${collName}/ (${count} documents)`);
                
                const samples = await db.collection(collName)
                    .find({})
                    .limit(2)
                    .toArray();
                
                if (samples.length > 0) {
                    const keys = Object.keys(samples[0]);
                    keys.forEach((key, idx) => {
                        const isLast = idx === keys.length - 1;
                        const example1 = JSON.stringify(samples[0][key]);
                        const example2 = samples[1] ? JSON.stringify(samples[1][key]) : 'N/A';
                        
                        console.log(`│   ${isLast ? '└' : '├'}── ${key}`);
                        console.log(`│   ${isLast ? ' ' : '│'}      Example 1: ${example1.length > 60 ? example1.substring(0, 60) + '...' : example1}`);
                        console.log(`│   ${isLast ? ' ' : '│'}      Example 2: ${example2.length > 60 ? example2.substring(0, 60) + '...' : example2}`);
                    });
                    console.log('│');
                }
            } catch (err) {
                console.log(`│   ⚠️  Collection "${collName}" not accessible`);
            }
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error);
    } finally {
        await client.close();
    }
}

printStructure();
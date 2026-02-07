import { MongoClient } from "mongodb";
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGO_URI = process.env.MONGO_DB!;

async function printStructure() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        const db = client.db();
        
        console.log('\n📂 Database Structure\n');
        
        const collections = ['stops', 'routes', 'aggregated'];
        
        for (const collName of collections) {
            const samples = await db.collection(collName).aggregate([
                { $sample: { size: 2 } }
            ]).toArray();
            
            if (samples.length > 0) {
                console.log(`├── ${collName}/`);
                
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
        }
        
    } finally {
        await client.close();
    }
}

printStructure();
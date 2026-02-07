import { MongoClient } from "mongodb";
import * as dotenv from 'dotenv';
import * as path from 'path';

//Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Env Var
const BMTC_STOPS_URL = process.env.BMTC_STOPS_URL!;
const BMTC_ROUTES_URL = process.env.BMTC_ROUTES_URL!;
const BMTC_AGGREGATED_URL = process.env.BMTC_AGGREGATED_URL!;
const MONGO_URI = process.env.MONGO_DB!;

interface GeoJSONFeature{
    type: string;
    geometry: {
        type:string;
        coordinates: number [] | number [][] | number [][][];
    };
    properties: Record<string, any>;    
}

interface GeoJSONCollection {
    type: string;
    features: GeoJSONFeature[]; 
}

async function fetchGeoJSON(url: string): Promise<GeoJSONCollection> {
    console.log(`Fetching Data From: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error (`Failed to grab bruh ${url}: ${response.statusText}`);
    }

    return await response.json() as GeoJSONCollection;
}

async function updateDatabase() {
    if (!MONGO_URI) {
        throw new Error('MONGO_DB environment variable is not set in .env.local');
    }
    
    console.log('MongoDB URI loaded:', MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials
    
    const client = new MongoClient(MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // 5 second timeout
        connectTimeoutMS: 10000,
    });

    try {
        console.log('Making Love To Mongo DB');
        await client.connect();
        console.log('Bonded To MongoDB Hopefully....')

        const db = client.db();

        // fetch all data
        console.log('\n--- Grabinn GeoJSON Data ---');
        const [stopsData, routesData, aggregatedData] = await Promise.all([
            fetchGeoJSON(BMTC_STOPS_URL),
            fetchGeoJSON(BMTC_ROUTES_URL),
            fetchGeoJSON(BMTC_AGGREGATED_URL)
        ]);

        console.log(`Stops: ${stopsData.features.length} features`);
        console.log(`Routes: ${routesData.features.length} features`);
        console.log(`Aggregated: ${aggregatedData.features.length} features`);

        // Process An Insert Stops
        console.log('\n--- Upgardin Stops Collection ---');
        const stopsCollection = db.collection('stops');
        await stopsCollection.deleteMany({});

        const stops = stopsData.features.map(feature => ({
            ...feature.properties,
            geometry: feature.geometry,
            location: {
                type: 'Point',
                coordinates: feature.geometry.coordinates
            }
        }));

        if (stops.length > 0) {
            // Insert in batches of 1000 to avoid timeout
            const batchSize = 1000;
            for (let i = 0; i < stops.length; i += batchSize) {
                const batch = stops.slice(i, i + batchSize);
                await stopsCollection.insertMany(batch);
                console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} stops`);
            }

            // make geospatial index for location based queries
            await stopsCollection.createIndex({ location: '2dsphere' });
            console.log(`Total inserted: ${stops.length} stops`);    
        }

        // Process An Insert Routes
        console.log('\n--- Upgradin Routes Collection ---');
        const routesCollection = db.collection('routes');
        console.log('Clearing existing routes...');
        await routesCollection.deleteMany({});
        console.log('Routes cleared, preparing data...');

        const routes = routesData.features.map(feature => ({
            ...feature.properties,
            geometry: feature.geometry
        }));

        if (routes.length > 0) {
            // Insert in batches of 1000
            const batchSize = 1000;
            for (let i = 0; i < routes.length; i += batchSize) {
                const batch = routes.slice(i, i + batchSize);
                await routesCollection.insertMany(batch);
                console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} routes`);
            }
            console.log(`Total inserted: ${routes.length} routes`);
        }

        // Process An Insert Aggregated
        console.log('\n--- Upgradin Aggregated Collection ---');
        const aggregatedCollection = db.collection('aggregated');
        console.log('Clearing existing aggregated data...');
        await aggregatedCollection.deleteMany({});
        console.log('Aggregated data cleared, preparing data...');

        const aggregated = aggregatedData.features.map(feature => ({
            ...feature.properties,
            geometry: feature.geometry
        }));

        if (aggregated.length > 0) {
            // Insert in batches of 1000
            const batchSize = 1000;
            for (let i = 0; i < aggregated.length; i += batchSize) {
                const batch = aggregated.slice(i, i + batchSize);
                await aggregatedCollection.insertMany(batch);
                console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} aggregated records`);
            }
            console.log(`Total inserted: ${aggregated.length} aggregated records`);
        }

        console.log('\n Database Updated Cleanly Uff Safe Hehehe...')

    }catch (error) {
        console.error('Error Daa Cooked:', error);
        throw error;
    } finally {
        await client.close();
        console.log('MogoDB Left The Chat');
    }
}

updateDatabase()
    .then(() => {
        console.log('\n All Done Bravo');
        process.exit(0);
    })
    .catch((error) => {
        console.error('What The Flip:', error);
        process.exit(1);
    })
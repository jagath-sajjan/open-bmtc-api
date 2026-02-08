import clientPromise from "@/lib/mongo";

export async function GET() {
    const client = await clientPromise;
    const db = client.db("bmtc");

    const [stops, routes, aggregated] = await Promise.all([
        db.collection("stops").estimatedDocumentCount(),
        db.collection("routes").estimatedDocumentCount(),
        db.collection("aggregated").estimatedDocumentCount()
    ]);

    return Response.json(
        {
            name: "Open BMTC API",
            version: "v1",
            datasets: {
                stops,
                routes,
                aggregated
            },
            features: {
                bbox: true,
                route_filter: true,
                geospatial: true,
                simplification: true
            }
        },
        {
            headers: {
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}

import clientPromise from "@/lib/mongo";

export async function GET() {
    const start = Date.now();

    try {
        const client = await clientPromise;
        await client.db("bmtc").command({ ping: 1 });

        return Response.json(
            {
                status: "ok",
                db: "connected",
                latency_ms: Date.now() - start,
                timestamp: new Date().toISOString()
            },
            {
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    } catch {
        return Response.json(
            {
                status: "down",
                db: "disconnected",
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

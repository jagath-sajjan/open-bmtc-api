export async function GET() {
    const res = await fetch(process.env.BMTC_AGGREGATED_URL!, {
        next: { revalidate: 864000 } // 24h cache
    });

    if (!res.ok) {
        return new Response("Failed To Fetch AggStops", { status: 500 });
    }

    return new Response(await res.text(), {
        headers: {
            "Content-Type": "applications/json",
            "Cache-Control": "public,max-age=86400"
        }
    });
}
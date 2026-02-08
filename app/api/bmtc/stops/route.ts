import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongo";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {

    const routeId = req.nextUrl.searchParams.get("routeId");
    const normalizedRouteId = routeId
        ? routeId
            .toUpperCase()
            .trim()
            .replace(/\s+/g, "")
            .replace(/^(\d+)([A-Z])$/, "$1-$2")
        : null;

    const bboxParam = req.nextUrl.searchParams.get("bbox");

    const client = await clientPromise;
    const db = client.db("bmtc");
    const collection = db.collection("stops");

    const query: any = {};

    if (normalizedRouteId) {
        query.route_list = normalizedRouteId;
    }

    if (bboxParam) {
        const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

        if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
            return new Response("Invaild bbox", { status: 400 });
        }

        query.location = {
            $geoWithin: {
                $box: [
                    [minLng, minLat],
                    [maxLng, maxLat]
                ]
            }
        };
    }

    const docs = await collection.find(
        query,
        {
            projection: {
                _id: 0,
                geometry: 1,
                name: 1,
                trip_count: 1,
                route_count: 1,
                route_list: 1,
                id: 1
            }
        }
    )
    .limit(500)
    .toArray();

    const features = docs.map((doc: any) => ({
        type: "Feature",
        geometry: doc.geometry,
        properties: {
            name: doc.name,
            trip_count: doc.trip_count,
            route_count: doc.route_count,
            route_list: doc.route_list,
            id: doc.id
        }
    }));

    return Response.json(
        {
            type: "FeatureCollection",
            features
        },
        {
            headers: {
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}

// export async function GET() {
//     const res = await fetch(process.env.BMTC_STOPS_URL!, {
//         cache: "no-store" // http cachin
//        // next: { revalidate: 864000 } // 24h cache
//     });

//     if (!res.ok) {
//         return new Response("Failed to Fetch Stops", { status: 500 });
//     }

//     return new Response(await res.text(), {
//         headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "public, max-age=86400, stale-while-revalidate=43200"
//         }
//     });
// }
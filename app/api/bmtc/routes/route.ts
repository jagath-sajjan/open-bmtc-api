import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongo";

export const runtime = "nodejs";

function simplifyLineString(
    coornidates: number[][],
    tolerance: number
) {
    if (coornidates.length <= 2) return coornidates;

    const simplified: number[][] = [coornidates[0]];
    let lastKept = coornidates[0];

    for (let i = 1; i < coornidates.length - 1; i++) {
        const [lng, lat] = coornidates[i];
        const [lastLng, lastLat] = lastKept;

        const dist = Math.abs(lng - lastLng) + Math.abs(lat - lastLat);

        if (dist >= tolerance) {
            simplified.push(coornidates[i]);
            lastKept = coornidates[i];
        }
    } 
    simplified.push(coornidates[coornidates.length-1]);
    return simplified;
}

export async function GET(req: NextRequest) {

    const routeId = req.nextUrl.searchParams.get("routeId");
    const simplifyParam = req.nextUrl.searchParams.get("simplify");
    const simplifyTolerance = simplifyParam ? Number(simplifyParam): null;

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
    const collection = db.collection("routes");

    const query: any = {};

    if (normalizedRouteId){
        query.id = normalizedRouteId;
    }

    if (bboxParam) {
        const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

        if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
            return new Response("Invalid bbox", { status: 400 });
        }

        query.geometry = {
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
                full_name: 1,
                trip_count: 1,
                stop_count: 1,
                id: 1,
                direction_id: 1
            }
        }
    )
    .limit(200)
    .toArray();

    let features = docs.map((doc: any) => ({
        type: "Feature",
        geometry: doc.geometry,
        properties: {
            name: doc.name,
            full_name: doc.full_name,
            trip_count: doc.trip_count,
            stop_count: doc.stop_count,
            id: doc.id,
            direction_id: doc.direction_id
        }
    }));

    if (simplifyTolerance) {
        features = features.map((feature: any) => {
            if (feature.geometry.type !== "LineString") return feature;

            return {
                ...feature,
                geometry: {
                    ...feature.geometry,
                    coordinates: simplifyLineString(
                        feature.geometry.coordinates, simplifyTolerance
                    )
                }
            };
        });
    }

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
//     const res = await fetch(process.env.BMTC_ROUTES_URL !, {
//         cache: "no-store" // http cachin
//        // next: { revalidate: 864000 } // 24h cache
//     })

//     if (!res.ok) {
//         return new Response("Failed To Fetch Routes", { status: 500 });
//     }

//     return new Response(await res.text(), {
//         headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "public,max-age=86400, stale-while-revalidate=43200"
//         }
//     });
// }
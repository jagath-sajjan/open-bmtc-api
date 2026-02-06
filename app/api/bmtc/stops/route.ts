// trying ?bbox
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {

    const routeId = req.nextUrl.searchParams.get("routeId");
    const normalizedRouteId = routeId
    ? routeId
        .toUpperCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/^(\d+)([A-Z])$/, "$1-$2")
    : null;


    const bboxParam = req.nextUrl.searchParams.get("bbox"); // gets params

    const res = await fetch(process.env.BMTC_STOPS_URL!, {
        cache: "no-store" // http cachin
    })

    if (!res.ok) {
        return new Response("Failed To Fetch Stops", { status: 500 });
    }

    const geojson = await res.json();
    let features = geojson.features;

    if (normalizedRouteId) {
        features = features.filter(
            (f: any) => Array.isArray(f.properties?.route_list) && f.properties.route_list.map((r:string) => r.toUpperCase()).includes(normalizedRouteId)
        );
    }

    if (!bboxParam) {
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

    const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
        return new Response("Invaild bbox", { status: 400 });
    }

    features = features.filter((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        return (
            lng >= minLng &&
            lng <= maxLng &&
            lat >= minLat &&
            lat <= maxLat
        )
    });

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
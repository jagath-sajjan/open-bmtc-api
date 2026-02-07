import { NextRequest } from "next/server";

export const runtime = "edge";

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

    const res = await fetch(process.env.BMTC_ROUTES_URL!, {
        cache: "no-store"
    })

    if (!res.ok) {
        return new Response("Failed TO Fetch Routes", { status: 500 });
    }

    const geojson = await res.json();
    let features = geojson.features;

    if (normalizedRouteId){
        features = features.filter(
            (f: any) => f.properties?.route_id?.toUpperCase() === normalizedRouteId
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
        return new Response("Invalid bbox", { status: 400 });
    }

    features = features.filter((feature: any) => {
        if (feature.geometry.type !== "LineString") return false;

        return feature.geometry.coordinates.some(
            ([lng, lat]: number []) =>
                lng >= minLng &&
                lng <= maxLng &&
                lat >= minLat &&
                lat <= maxLat
        );
    });

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
                "Cache-Control": "public,  max-age=3600"
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
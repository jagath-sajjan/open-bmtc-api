import { NextRequest } from "next/server";

// helper func
function simplifyLineString(
    coorndinates: number[][],
    tolerance: number
) {
    if (coorndinates.length <= 2) return coorndinates;

    const simplified: number[][] = [coorndinates[0]];
    let lastKept = coorndinates[0];

    for (let i = 1; i < coorndinates.length - 1; i++) {
        const [lng, lat] = coorndinates[i];
        const [lastLng, lastLat] = lastKept;

        const dist = Math.abs(lng - lastLng) + Math.abs(lat - lastLat);

        if (dist >= tolerance) {
            simplified.push(coorndinates[i]);
            lastKept = coorndinates[i];
        }
    }
    simplified.push(coorndinates[coorndinates.length -1]);
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
    // fixes diff issue now 258c = 258-C 

    const bboxParam = req.nextUrl.searchParams.get("bbox"); // gets params

    const res = await fetch(process.env.BMTC_AGGREGATED_URL!, {
        cache: "no-store" // http cachin
    })

    if (!res.ok) {
        return new Response("Failed To Fetch AggStops", { status: 500 });
    }

    // prase geojson
    const geojson = await res.json();
    let features = geojson.features;

    if (normalizedRouteId) {
        features = features.filter(
            (f: any) => Array.isArray(f.properties?.route_list) && f.properties.route_list.map((r:string) => r.toUpperCase()).includes(normalizedRouteId)
        );
    } 

    // no bbox fallback dump
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

    // validate bbox
    // if value NaN, bbox invalid
    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
        return new Response("Invaild bbox", { status: 400 });
    }

    // filtering geojson
    features = features.filter((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        return (
            lng >= minLng &&
            lng <= maxLng &&
            lat >= minLat &&
            lat <= maxLat
        )
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

    // filtered features return
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
//     const res = await fetch(process.env.BMTC_AGGREGATED_URL!, {
//         cache: "no-store" // http cache
//         // next: { revalidate: 864000 } // 24h cache
//     });

//     if (!res.ok) {
//         return new Response("Failed To Fetch AggStops", { status: 500 });
//     }

//     return new Response(await res.text(), {
//         headers: {
//             "Content-Type": "applications/json",
//             "Cache-Control": "public,max-age=86400, stale-while-revalidate=43200"
//         }
//     });
// }
import { NextRequest } from "next/server";
import { features } from "process";

export async function GET(req: NextRequest) {
    const bboxParam = req.nextUrl.searchParams.get("bbox"); // gets params

    const res = await fetch(process.env.BMTC_AGGREGATED_URL!, {
        cache: "no-store" // http cachin
    })

    if (!res.ok) {
        return new Response("Failed To Fetch AggStops", { status: 500 });
    }

    // prase geojson
    const geojson = await res.json();

    // no bbox fallback dump
    if (!bboxParam) {
        return Response.json(geojson, {
            headers: {
                "Cache-Control": "public, max-age=3600"
            }
        });
    }
    const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

    // validate bbox
    // if value NaN, bbox invalid
    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
        return new Response("Invaild bbox", { status: 400 });
    }

    // filtering geojson
    const filteredFeatures = geojson.features.filter((feature: any) => {
        const [lng, lat] = feature.geometry.coordinates;
        return (
            lng >= minLng &&
            lng <= maxLng &&
            lat >= minLat &&
            lat <= maxLat
        ); 
    });

    // filtered features return
    return Response.json(
        {
            type: "FilterdCollection",
            features: filteredFeatures
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